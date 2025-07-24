-- Fix infinite recursion in profiles policies
-- This migration removes the problematic recursive policies and creates safer alternatives

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.profiles;

-- Create a safer policy structure
-- First, create a function to check if current user is admin without recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_value user_role;
BEGIN
  SELECT role INTO user_role_value 
  FROM public.profiles 
  WHERE user_id = user_uuid;
  
  RETURN user_role_value = 'Admin';
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new policies that don't cause recursion
-- Policy 1: Users can view their own profile + admins can view all
CREATE POLICY "Users can view own profile or admin can view all" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  public.is_admin(auth.uid())
);

-- Policy 2: Users can update their own profile (except role)
CREATE POLICY "Users can update own profile except role" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  (OLD.role = NEW.role OR public.is_admin(auth.uid()))
);

-- Policy 3: Only admins can update any profile's role
CREATE POLICY "Only admins can update roles" 
ON public.profiles 
FOR UPDATE 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- Add comment explaining the fix
COMMENT ON FUNCTION public.is_admin(UUID) IS 'Helper function to check admin status without causing policy recursion';