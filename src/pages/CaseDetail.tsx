
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import LivePreview from "@/components/LivePreview";
import CodeEditor from "@/components/CodeEditor";
import CaseMetadata from "@/components/CaseMetadata";
import { useState } from "react";

const CaseDetail = () => {
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - in a real app, this would come from an API
  const caseData = {
    id: id || "1",
    title: "毛玻璃仪表板",
    tags: ["毛玻璃风格", "仪表板", "现代", "SaaS"],
    contributor: {
      name: "陈小明",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
    },
    prompt: "创建一个采用毛玻璃设计原则的精美数据分析仪表板。使用带有微妙透明度的磨砂玻璃卡片、发光元素和深色太空主题。包含交互式图表、侧边栏导航，以及深蓝和紫色调的鲜艳渐变装饰。",
    structuredBreakdown: [
      { emoji: "🎨", title: "风格", value: "毛玻璃风格，鲜艳渐变" },
      { emoji: "📦", title: "主题", value: "SaaS产品的数据分析仪表板" },
      { emoji: "💡", title: "元素", value: "磨砂玻璃卡片，发光图表，侧边栏" },
      { emoji: "🌈", title: "颜色", value: "深太空蓝，明亮白色高光" },
      { emoji: "📱", title: "布局", value: "基于卡片的响应式网格界面" },
      { emoji: "✨", title: "效果", value: "模糊效果，微妙阴影，渐变叠加" }
    ],
    html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>毛玻璃仪表板</title>
</head>
<body>
    <div class="dashboard">
        <h1>分析仪表板</h1>
        <div class="card">
            <h2>营收</h2>
            <p>¥425,000</p>
        </div>
    </div>
</body>
</html>`,
    css: `body {
  margin: 0;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  font-family: 'Inter', sans-serif;
  min-height: 100vh;
}

.dashboard {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
  margin: 1rem 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}`,
    javascript: `// Interactive dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});`
  };

  return (
    <div className="min-h-screen bg-background">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Content */}
          <div className="lg:col-span-2 space-y-6">
            <LivePreview 
              html={caseData.html}
              css={caseData.css}
              javascript={caseData.javascript}
            />
            
            <CodeEditor 
              html={caseData.html}
              css={caseData.css}
              javascript={caseData.javascript}
            />
          </div>
          
          {/* Right Column - Metadata */}
          <div className="lg:col-span-1">
            <CaseMetadata caseData={caseData} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CaseDetail;
