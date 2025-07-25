-- 创建提示词模板表
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_id ON prompt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_type ON prompt_templates(type);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_updated_at ON prompt_templates(updated_at);

-- 启用RLS
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 用户只能查看自己的模板
CREATE POLICY "Users can view own prompt templates" ON prompt_templates
    FOR SELECT USING (auth.uid() = user_id);

-- 用户只能插入自己的模板
CREATE POLICY "Users can insert own prompt templates" ON prompt_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的模板
CREATE POLICY "Users can update own prompt templates" ON prompt_templates
    FOR UPDATE USING (auth.uid() = user_id);

-- 用户只能删除自己的模板
CREATE POLICY "Users can delete own prompt templates" ON prompt_templates
    FOR DELETE USING (auth.uid() = user_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER update_prompt_templates_updated_at
    BEFORE UPDATE ON prompt_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入一些默认的提示词模板
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
);