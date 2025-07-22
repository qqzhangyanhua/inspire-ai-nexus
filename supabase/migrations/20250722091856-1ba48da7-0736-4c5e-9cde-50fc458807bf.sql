-- 修复 toggle_case_favorite 函数中的列名歧义问题
CREATE OR REPLACE FUNCTION public.toggle_case_favorite(case_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_uuid UUID;
  is_favorited boolean;
BEGIN
  user_uuid := auth.uid();
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Check if already favorited - 明确使用表别名
  SELECT EXISTS(
    SELECT 1 FROM public.user_favorites uf
    WHERE uf.user_id = user_uuid AND uf.case_id = toggle_case_favorite.case_id
  ) INTO is_favorited;

  IF is_favorited THEN
    -- Remove favorite - 明确使用表别名
    DELETE FROM public.user_favorites uf
    WHERE uf.user_id = user_uuid AND uf.case_id = toggle_case_favorite.case_id;
    RETURN false;
  ELSE
    -- Add favorite - 明确指定列名
    INSERT INTO public.user_favorites (user_id, case_id) 
    VALUES (user_uuid, toggle_case_favorite.case_id);
    RETURN true;
  END IF;
END;
$function$