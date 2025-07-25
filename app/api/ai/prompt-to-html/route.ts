import { NextRequest, NextResponse } from 'next/server';

interface AIConfig {
  baseUrl: string;
  apiKey: string;
}

interface RequestBody {
  prompt: string;
  config: AIConfig;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, config }: RequestBody = await request.json();

    if (!prompt || !config.apiKey || !config.baseUrl) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 构建OpenAI API请求
    const openaiResponse = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
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
- description: 对生成代码的说明，包括使用的组件、布局特点、设计理念等`
          },
          {
            role: 'user',
            content: `请根据以下需求生成HTML代码：\n\n${prompt}\n\n请使用Tailwind CSS进行样式设计，确保代码质量和用户体验。`
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI API错误:', errorData);
      return NextResponse.json(
        { error: 'AI服务请求失败' },
        { status: 500 }
      );
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'AI服务返回空内容' },
        { status: 500 }
      );
    }

    // 尝试解析JSON响应
    let result;
    try {
      // 提取JSON部分（如果AI返回的是包含JSON的文本）
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/{[\s\S]*}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      // 如果解析失败，尝试提取HTML代码
      const htmlMatch = content.match(/```html\s*([\s\S]*?)\s*```/);
      const htmlCode = htmlMatch ? htmlMatch[1] : generateDefaultHTML(prompt);
      
      result = {
        html: htmlCode,
        prompt: `优化后的提示词：${prompt}`,
        description: '基于您的需求生成的HTML代码，使用Tailwind CSS进行样式设计，具有响应式布局和现代化的用户界面。'
      };
    }

    // 确保HTML代码包含完整的文档结构
    if (result.html && !result.html.includes('<!DOCTYPE html>')) {
      result.html = wrapInCompleteHTML(result.html);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('处理请求时出错:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 生成默认HTML结构的辅助函数
function generateDefaultHTML(prompt: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI生成的页面</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-6 text-center">基于您的需求</h1>
            <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <p class="text-blue-800 font-medium">原始需求：</p>
                <p class="text-blue-700 mt-2">${prompt}</p>
            </div>
            <div class="text-center">
                <p class="text-gray-600 mb-4">这是一个基础的页面结构，您可以根据具体需求进行进一步定制。</p>
                <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300">
                    开始使用
                </button>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// 将HTML片段包装成完整文档的辅助函数
function wrapInCompleteHTML(htmlContent: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI生成的页面</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${htmlContent}
</body>
</html>`;
}