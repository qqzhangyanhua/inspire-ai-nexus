-- 插入分类数据
INSERT INTO public.categories (name, name_zh, slug, description) VALUES
('Glassmorphism', '毛玻璃风格', 'glassmorphism', '透明毛玻璃效果的现代设计风格'),
('Neumorphism', '新拟物主义', 'neumorphism', '柔和阴影和浮雕效果的设计风格'), 
('Y2K', 'Y2K风格', 'y2k', '千禧年复古未来主义设计风格'),
('Aurora', '极光界面', 'aurora', '绚丽极光色彩的界面设计'),
('Minimalism', '极简主义', 'minimalism', '简洁干净的极简设计风格'),
('Brutalism', '野兽派', 'brutalism', '粗犷大胆的野兽派设计风格');

-- 插入案例数据
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
  null as author_id, -- 设为null，表示系统案例
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
JOIN category_mapping cm ON cm.name_zh = mock_data.category_name;