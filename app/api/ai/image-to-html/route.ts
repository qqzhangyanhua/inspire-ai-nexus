import { NextRequest, NextResponse } from 'next/server';

interface AIConfig {
  baseUrl: string;
  apiKey: string;
}

interface RequestBody {
  image: string;
  config: AIConfig;
}

export async function POST(request: NextRequest) {
  try {
    const { image, config }: RequestBody = await request.json();

    if (!image || !config.apiKey || !config.baseUrl) {
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
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
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
- description: 对生成代码的说明和特性介绍`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请根据这张图片生成对应的HTML代码，使用Tailwind CSS进行样式设计。'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
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
      // 如果解析失败，创建一个默认结构
      result = {
        html: generateDefaultHTML(content),
        prompt: '根据上传的图片生成的UI界面',
        description: '基于图片内容生成的HTML代码，使用Tailwind CSS进行样式设计。'
      };
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
function generateDefaultHTML(content: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI生成的页面</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h1 class="text-2xl font-bold text-gray-800 mb-4">AI生成的内容</h1>
            <div class="prose max-w-none">
                <pre class="whitespace-pre-wrap text-sm text-gray-600">${content}</pre>
            </div>
        </div>
    </div>
</body>
</html>`;
}