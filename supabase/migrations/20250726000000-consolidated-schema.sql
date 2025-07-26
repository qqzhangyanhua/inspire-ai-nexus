-- Consolidated Migration for Inspire AI Nexus
-- This migration consolidates all previous migrations into a single, ordered schema
-- Date: 2025-07-26

-- ============================================
-- 1. UTILITY FUNCTIONS
-- ============================================

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. USER ROLE SYSTEM
-- ============================================

-- Create enum type for user roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Ordinary', 'Admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Helper function to check admin status (prevents recursion)
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

-- ============================================
-- 3. PROFILES TABLE
-- ============================================

-- Create profiles table with role support
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role user_role NOT NULL DEFAULT 'Ordinary',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update own profile except role" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  (OLD.role = NEW.role OR public.is_admin(auth.uid()))
);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can update roles" 
ON public.profiles 
FOR UPDATE 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================
-- 4. USER REGISTRATION HANDLER
-- ============================================

-- Function to handle new user registration (with Google OAuth support)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'preferred_username',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'Ordinary')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_zh TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS and policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create categories" 
ON public.categories 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Add timestamp trigger
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 6. CASES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  author_id UUID REFERENCES public.profiles(user_id),
  prompt TEXT,
  code_content TEXT,
  html_content TEXT,
  css_content TEXT,
  javascript_content TEXT,
  preview_url TEXT,
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived', 'approval')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS and policies
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published cases are viewable by everyone" 
ON public.cases 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Authors can view their own cases" 
ON public.cases 
FOR SELECT 
USING (auth.uid() = author_id);

CREATE POLICY "Authors can create their own cases" 
ON public.cases 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own cases" 
ON public.cases 
FOR UPDATE 
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own cases" 
ON public.cases 
FOR DELETE 
USING (auth.uid() = author_id);

-- Add timestamp trigger
CREATE TRIGGER update_cases_updated_at
BEFORE UPDATE ON public.cases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cases_category_id ON public.cases(category_id);
CREATE INDEX IF NOT EXISTS idx_cases_author_id ON public.cases(author_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_status_approval ON public.cases(status) WHERE status = 'approval';
CREATE INDEX IF NOT EXISTS idx_cases_featured ON public.cases(is_featured);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON public.cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_html_content ON public.cases USING gin (to_tsvector('english', html_content));
CREATE INDEX IF NOT EXISTS idx_cases_css_content ON public.cases USING gin (to_tsvector('english', css_content));
CREATE INDEX IF NOT EXISTS idx_cases_javascript_content ON public.cases USING gin (to_tsvector('english', javascript_content));

-- ============================================
-- 7. USER FAVORITES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, case_id)
);

-- Enable RLS and policies
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites" 
ON public.user_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites" 
ON public.user_favorites 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.user_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_case_id ON public.user_favorites(case_id);

-- ============================================
-- 8. CASE COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.case_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.case_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS and policies
ALTER TABLE public.case_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" 
ON public.case_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.case_comments 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own comments" 
ON public.case_comments 
FOR UPDATE 
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own comments" 
ON public.case_comments 
FOR DELETE 
USING (auth.uid() = author_id);

-- Add timestamp trigger
CREATE TRIGGER update_case_comments_updated_at
BEFORE UPDATE ON public.case_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_case_comments_case_id ON public.case_comments(case_id);
CREATE INDEX IF NOT EXISTS idx_case_comments_author_id ON public.case_comments(author_id);

-- ============================================
-- 9. PROMPT TEMPLATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS prompt_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('image-to-html', 'prompt-to-html')),
    content TEXT NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_id ON prompt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_type ON prompt_templates(type);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_updated_at ON prompt_templates(updated_at);

-- Enable RLS and policies
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prompt templates" ON prompt_templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompt templates" ON prompt_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompt templates" ON prompt_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompt templates" ON prompt_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Add timestamp trigger
CREATE TRIGGER update_prompt_templates_updated_at
    BEFORE UPDATE ON prompt_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. UTILITY FUNCTIONS
-- ============================================

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_case_view_count(case_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.cases 
  SET view_count = view_count + 1 
  WHERE id = case_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle favorite (fixed column ambiguity)
CREATE OR REPLACE FUNCTION public.toggle_case_favorite(case_id UUID)
RETURNS boolean AS $$
DECLARE
  user_uuid UUID;
  is_favorited boolean;
BEGIN
  user_uuid := auth.uid();
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Check if already favorited
  SELECT EXISTS(
    SELECT 1 FROM public.user_favorites uf
    WHERE uf.user_id = user_uuid AND uf.case_id = toggle_case_favorite.case_id
  ) INTO is_favorited;

  IF is_favorited THEN
    -- Remove favorite
    DELETE FROM public.user_favorites uf
    WHERE uf.user_id = user_uuid AND uf.case_id = toggle_case_favorite.case_id;
    RETURN false;
  ELSE
    -- Add favorite
    INSERT INTO public.user_favorites (user_id, case_id) 
    VALUES (user_uuid, toggle_case_favorite.case_id);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- ============================================
-- 11. COMMENTS
-- ============================================

-- Add table comments
COMMENT ON TABLE public.profiles IS '用户档案表，包含用户基本信息和角色';
COMMENT ON COLUMN public.profiles.role IS 'User role: Ordinary (default) or Admin';
COMMENT ON COLUMN public.cases.status IS '案例状态: draft=草稿, published=已发布, archived=已归档, approval=待审批';
COMMENT ON COLUMN public.cases.html_content IS 'HTML代码内容';
COMMENT ON COLUMN public.cases.css_content IS 'CSS样式内容'; 
COMMENT ON COLUMN public.cases.javascript_content IS 'JavaScript脚本内容';
COMMENT ON FUNCTION public.is_admin(UUID) IS 'Helper function to check admin status without causing policy recursion';

-- ============================================
-- 12. DATA MIGRATION
-- ============================================

-- Create profiles for existing OAuth users who don't have profiles yet
INSERT INTO public.profiles (user_id, username, display_name, avatar_url, role)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'username',
    au.raw_user_meta_data->>'preferred_username',
    split_part(au.email, '@', 1)
  ) as username,
  COALESCE(
    au.raw_user_meta_data->>'display_name',
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ) as display_name,
  au.raw_user_meta_data->>'avatar_url' as avatar_url,
  'Ordinary' as role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL
  AND au.email IS NOT NULL;

-- Insert categories
INSERT INTO public.categories (name, name_zh, slug, description) VALUES
('Glassmorphism', '毛玻璃风格', 'glassmorphism', '透明毛玻璃效果的现代设计风格'),
('Neumorphism', '新拟物主义', 'neumorphism', '柔和阴影和浮雕效果的设计风格'), 
('Y2K', 'Y2K风格', 'y2k', '千禧年复古未来主义设计风格'),
('Aurora', '极光界面', 'aurora', '绚丽极光色彩的界面设计'),
('Minimalism', '极简主义', 'minimalism', '简洁干净的极简设计风格'),
('Brutalism', '野兽派', 'brutalism', '粗犷大胆的野兽派设计风格')
ON CONFLICT (name) DO NOTHING;

-- Insert sample cases
WITH category_mapping AS (
  SELECT 
    name_zh,
    id as category_id
  FROM public.categories
)
INSERT INTO public.cases (title, description, image_url, category_id, author_id, prompt, code_content, preview_url, tags, status) 
SELECT 
  mock_data.title,
  mock_data.description,
  mock_data.image_url,
  cm.category_id,
  null as author_id,
  mock_data.prompt,
  mock_data.code_content,
  mock_data.preview_url,
  mock_data.tags,
  'published' as status
FROM (
  VALUES
    ('毛玻璃仪表板', '现代毛玻璃风格的数据仪表板界面', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop', '毛玻璃风格', 'Create a glassmorphism dashboard with transparent cards and backdrop blur effects', '<div class="dashboard">Dashboard content</div>', '/preview/glassmorphism-dashboard', ARRAY['dashboard', 'glassmorphism', 'ui']),
    ('新拟物计算器', '柔和阴影效果的新拟物主义计算器', 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=350&fit=crop', '新拟物主义', 'Design a neumorphism calculator with soft shadows and embossed buttons', '<div class="calculator">Calculator content</div>', '/preview/neumorphism-calculator', ARRAY['calculator', 'neumorphism', 'app']),
    ('Y2K作品集网站', '千禧年复古风格的个人作品集', 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=280&fit=crop', 'Y2K风格', 'Build a Y2K style portfolio website with retro futuristic elements', '<div class="portfolio">Portfolio content</div>', '/preview/y2k-portfolio', ARRAY['portfolio', 'y2k', 'website']),
    ('极光登录表单', '绚丽极光背景的登录界面', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=320&fit=crop', '极光界面', 'Create an aurora-themed login form with animated gradient backgrounds', '<div class="login">Login form content</div>', '/preview/aurora-login', ARRAY['login', 'aurora', 'form']),
    ('极简博客', '简洁优雅的极简主义博客设计', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop', '极简主义', 'Design a minimalist blog with clean typography and white space', '<div class="blog">Blog content</div>', '/preview/minimalist-blog', ARRAY['blog', 'minimal', 'typography']),
    ('野兽派落地页', '粗犷大胆的野兽派网站首页', 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=280&fit=crop', '野兽派', 'Build a brutalist landing page with bold typography and raw concrete aesthetics', '<div class="landing">Landing page content</div>', '/preview/brutalist-landing', ARRAY['landing', 'brutalism', 'bold'])
) AS mock_data(title, description, image_url, category_name, prompt, code_content, preview_url, tags)
JOIN category_mapping cm ON cm.name_zh = mock_data.category_name
ON CONFLICT DO NOTHING;

-- Insert default prompt templates
INSERT INTO prompt_templates (name, type, content, description, user_id) VALUES
(
    '默认图片转HTML模板',
    'image-to-html',
    '你是一个专业的前端开发工程师，擅长将UI设计图转换为高质量的HTML代码。请根据用户提供的图片，生成对应的HTML代码，要求：

1. 使用Tailwind CSS进行样式设计
2. 代码结构清晰，语义化良好
3. 响应式设计，适配不同屏幕尺寸
4. 使用现代化的HTML5标准
5. 注重可访问性和用户体验
6. 生成完整的HTML文档，包含必要的meta标签和Tailwind CSS CDN链接

请返回JSON格式的响应，包含以下字段：
- html: 完整的HTML代码
- prompt: 根据图片内容生成的详细描述提示词
- description: 对生成代码的说明和特性介绍',
    '默认的图片转HTML提示词模板，适用于大多数UI设计图转换场景',
    '00000000-0000-0000-0000-000000000000'
),
(
    '默认提示词转HTML模板',
    'prompt-to-html',
    '你是一个专业的前端开发工程师，擅长根据需求描述创建高质量的HTML代码。请根据用户的提示词，生成对应的HTML代码，要求：

1. 使用Tailwind CSS进行样式设计
2. 代码结构清晰，语义化良好
3. 响应式设计，适配不同屏幕尺寸
4. 使用现代化的HTML5标准
5. 注重可访问性和用户体验
6. 生成完整的HTML文档，包含必要的meta标签和Tailwind CSS CDN链接
7. 根据需求添加适当的交互效果（使用Tailwind的hover、focus等状态类）
8. 确保颜色搭配和谐，布局美观

请返回JSON格式的响应，包含以下字段：
- html: 完整的HTML代码
- prompt: 优化后的详细提示词（基于原始提示词进行扩展和优化）
- description: 对生成代码的说明，包括使用的组件、布局特点、设计理念等',
    '默认的提示词转HTML模板，适用于大多数需求描述转换场景',
    '00000000-0000-0000-0000-000000000000'
)
ON CONFLICT DO NOTHING;