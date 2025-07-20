
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
    title: "Glassmorphism Dashboard",
    tags: ["Glassmorphism", "Dashboard", "Modern", "SaaS"],
    contributor: {
      name: "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
    },
    prompt: "Create a sleek data analysis dashboard with glassmorphism design principles. Use frosted glass cards with subtle transparency, glowing elements, and a dark space theme. Include interactive charts, sidebar navigation, and vibrant gradient accents in deep blue and purple tones.",
    structuredBreakdown: [
      { emoji: "🎨", title: "Style", value: "Glassmorphism, vibrant gradient" },
      { emoji: "📦", title: "Subject", value: "Data analysis dashboard for a SaaS product" },
      { emoji: "💡", title: "Elements", value: "Frosted glass cards, glowing charts, sidebar" },
      { emoji: "🌈", title: "Colors", value: "Deep space blue, bright white highlights" },
      { emoji: "📱", title: "Layout", value: "Responsive grid with card-based interface" },
      { emoji: "✨", title: "Effects", value: "Blur effects, subtle shadows, gradient overlays" }
    ],
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Glassmorphism Dashboard</title>
</head>
<body>
    <div class="dashboard">
        <h1>Analytics Dashboard</h1>
        <div class="card">
            <h2>Revenue</h2>
            <p>$42,500</p>
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
