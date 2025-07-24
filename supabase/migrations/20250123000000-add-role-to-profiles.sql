-- Add role column to profiles table
-- This migration adds a role field with 'Ordinary' as default and 'Admin' as another option

-- Create enum type for user roles (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Ordinary', 'Admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to profiles table with default value (only if it doesn't exist)
DO $$ BEGIN
    ALTER TABLE public.profiles 
    ADD COLUMN role user_role NOT NULL DEFAULT 'Ordinary';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Update existing profiles to have the default role
UPDATE public.profiles 
SET role = 'Ordinary' 
WHERE role IS NULL;

-- Update the handle_new_user function to include role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name, role)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'display_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'Ordinary')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add policy for role-based access (optional - admins can view all profiles)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'Admin'
  )
);

-- Add policy for role updates (only admins can change roles)
CREATE POLICY "Only admins can update roles" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'Admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'Admin'
  )
);

-- Create index on role column for better query performance
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Add comment to document the role column
COMMENT ON COLUMN public.profiles.role IS 'User role: Ordinary (default) or Admin';