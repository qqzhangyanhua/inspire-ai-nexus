import { NextRequest, NextResponse } from "next/server";

interface AIConfig {
  baseUrl: string;
  apiKey: string;
}

interface RequestBody {
  prompt: string;
  config: AIConfig;
}

interface HTMLResult {
  html: string;
  prompt: string;
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, config }: RequestBody = await request.json();

    if (!prompt || !config.apiKey || !config.baseUrl) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 构建OpenAI API请求
    const openaiResponse = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `你是一位世界级的前端开发专家，专精于现代网页设计、用户体验和 Tailwind CSS。你的使命是创建令人惊艳的、高质量的响应式 HTML 页面。

## 核心要求
1. **完美的视觉设计**: 创建现代、优雅、视觉冲击力强的界面
2. **专业级代码质量**: 语义化 HTML，清晰结构，最佳实践
3. **纯 Tailwind CSS**: 仅使用 Tailwind 功能类，禁用自定义 CSS
4. **高质量图片**: 使用可靠的占位图片服务
   - **Picsum Photos**: https://picsum.photos/800/600 (推荐，稳定可用)
   - **PlaceImg**: https://placeimg.com/800/600/tech (按分类)
   - **Lorem Picsum**: https://picsum.photos/id/1/800/600 (指定ID)
   - **示例用法**: 
     * 通用: https://picsum.photos/800/600
     * 正方形: https://picsum.photos/400
     * 模糊效果: https://picsum.photos/800/600?blur
   - 避免使用需要真实photo-id的Unsplash链接
5. **完整响应式**: 完美适配所有设备尺寸

## 设计标准
- **配色**: 使用现代、和谐的配色方案，注重对比度和可读性
- **排版**: 清晰的视觉层次，合理的间距和字体大小
- **交互**: 流畅的悬停效果、过渡动画和状态反馈
- **布局**: 平衡、对称，遵循黄金比例和网格系统
- **细节**: 阴影、圆角、渐变等微交互提升用户体验

## 技术要求
- 完整的 HTML5 文档结构
- 必要的 meta 标签和 SEO 优化
- 可访问性考虑 (ARIA 标签、语义化标签)
- 现代浏览器兼容性
- 性能优化 (图片懒加载等)

## 输出格式
严格按照以下 JSON 格式返回，不要包含任何解释文字：

{
  "html": "完整的HTML代码",
  "prompt": "优化扩展后的提示词",
  "description": "详细的技术说明和设计理念"
}

## 参考模板结构
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="页面描述">
    <title>页面标题</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="font-sans antialiased">
    <!-- 在这里创建令人惊艳的内容 -->
</body>
</html>`,
          },
          {
            role: "user",
            content: `请根据以下需求生成HTML代码：\n\n${prompt}\n\n请使用Tailwind CSS进行样式设计，确保代码质量和用户体验。`,
          },
        ],
        max_tokens: 6000,
        temperature: 0.3,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error("OpenAI API错误:", errorData);
      return NextResponse.json({ error: "AI服务请求失败" }, { status: 500 });
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "AI服务返回空内容" }, { status: 500 });
    }

    // 尝试解析JSON响应
    let result: HTMLResult;
    try {
      // 首先尝试直接解析为JSON
      result = JSON.parse(content);
    } catch (directParseError) {
      try {
        // 提取JSON代码块
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[1]);
        } else {
          // 尝试提取大括号内的JSON
          const braceMatch = content.match(/{[\s\S]*}/);
          if (braceMatch) {
            result = JSON.parse(braceMatch[0]);
          } else {
            throw new Error('No JSON found');
          }
        }
      } catch (parseError) {
        // 如果解析失败，尝试提取HTML代码
        const htmlMatch = content.match(/```html\s*([\s\S]*?)\s*```/);
        const htmlCode = htmlMatch ? htmlMatch[1] : generateDefaultHTML(prompt);

        result = {
          html: htmlCode,
          prompt: `基于需求优化的提示词：${prompt}`,
          description: "生成的专业级HTML代码，采用现代设计理念和Tailwind CSS，具备完整的响应式布局和优秀的用户体验。",
        };
      }
    }

    // 确保HTML代码包含完整的文档结构
    if (result.html && !result.html.includes("<!DOCTYPE html>")) {
      result.html = wrapInCompleteHTML(result.html);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("处理请求时出错:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
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
