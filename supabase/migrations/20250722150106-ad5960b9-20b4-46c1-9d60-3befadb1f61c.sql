-- 添加新的结构化代码存储列
ALTER TABLE public.cases 
ADD COLUMN html_content TEXT,
ADD COLUMN css_content TEXT,
ADD COLUMN javascript_content TEXT;

-- 添加注释说明新列用途
COMMENT ON COLUMN public.cases.html_content IS 'HTML代码内容';
COMMENT ON COLUMN public.cases.css_content IS 'CSS样式内容'; 
COMMENT ON COLUMN public.cases.javascript_content IS 'JavaScript脚本内容';

-- 为新列创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_cases_html_content ON public.cases USING gin (to_tsvector('english', html_content));
CREATE INDEX IF NOT EXISTS idx_cases_css_content ON public.cases USING gin (to_tsvector('english', css_content));
CREATE INDEX IF NOT EXISTS idx_cases_javascript_content ON public.cases USING gin (to_tsvector('english', javascript_content));