import { NextRequest, NextResponse } from 'next/server';

interface PromptTemplate {
  id?: string;
  name: string;
  type: 'image-to-html' | 'prompt-to-html';
  content: string;
  description?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

// 默认提示词模板
const defaultTemplates: PromptTemplate[] = [
  {
    id: 'default-image-to-html',
    name: '默认图片转HTML模板',
    type: 'image-to-html',
    content: `你是一个专业的前端开发工程师，擅长将UI设计图转换为高质量的HTML代码。请根据用户提供的图片，生成对应的HTML代码，要求：

1. 使用Tailwind CSS进行样式设计
2. 代码结构清晰，语义化良好
3. 响应式设计，适配不同屏幕尺寸
4. 使用现代化的HTML5标准
5. 注重可访问性和用户体验
6. 生成完整的HTML文档，包含必要的meta标签和Tailwind CSS CDN链接

请返回JSON格式的响应，包含以下字段：
- html: 完整的HTML代码
- prompt: 根据图片内容生成的详细描述提示词
- description: 对生成代码的说明和特性介绍`,
    description: '默认的图片转HTML提示词模板，适用于大多数UI设计图转换场景',
    user_id: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-prompt-to-html',
    name: '默认提示词转HTML模板',
    type: 'prompt-to-html',
    content: `你是一个专业的前端开发工程师，擅长根据需求描述创建高质量的HTML代码。请根据用户的提示词，生成对应的HTML代码，要求：

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
- description: 对生成代码的说明，包括使用的组件、布局特点、设计理念等`,
    description: '默认的提示词转HTML模板，适用于大多数需求描述转换场景',
    user_id: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// 获取提示词模板列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let templates = defaultTemplates;

    if (type) {
      templates = templates.filter(template => template.type === type);
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('处理请求时出错:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 获取特定模板内容
export async function POST(request: NextRequest) {
  try {
    const { templateId } = await request.json();
    
    const template = defaultTemplates.find(t => t.id === templateId);
    
    if (!template) {
      return NextResponse.json(
        { error: '模板不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('处理请求时出错:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}