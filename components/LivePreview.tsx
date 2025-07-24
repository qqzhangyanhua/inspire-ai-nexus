
import { RefreshCw, ExternalLink, Monitor, Tablet, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";

interface LivePreviewProps {
  html: string;
  css: string;
  javascript: string;
}

const LivePreview = ({ html, css, javascript }: LivePreviewProps) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    const generatePreviewContent = () => {
      // 检查HTML是否已经是完整的HTML文档
      const isCompleteHTML = html.includes('<!DOCTYPE html>') || html.includes('<html');
      
      if (isCompleteHTML) {
        // 如果是完整的HTML文档，直接使用，但需要注入额外的CSS和JavaScript
        let completeHTML = html;
        
        // 如果有额外的CSS，注入到head中
        if (css.trim()) {
          const cssTag = `<style>${css}</style>`;
          if (completeHTML.includes('</head>')) {
            completeHTML = completeHTML.replace('</head>', `${cssTag}\n</head>`);
          } else {
            // 如果没有head标签，在html标签后添加
            completeHTML = completeHTML.replace('<html', `<head>${cssTag}</head>\n<html`);
          }
        }
        
        // 如果有额外的JavaScript，注入到body结束前
        if (javascript.trim()) {
          const scriptTag = `<script>${javascript}</script>`;
          if (completeHTML.includes('</body>')) {
            completeHTML = completeHTML.replace('</body>', `${scriptTag}\n</body>`);
          } else {
            // 如果没有body结束标签，在html结束前添加
            completeHTML = completeHTML.replace('</html>', `${scriptTag}\n</html>`);
          }
        }
        
        return completeHTML;
      } else {
        // 如果不是完整的HTML文档，按原逻辑处理
        // 但要检查是否包含外部资源链接
        let externalResources = '';
        
        // 检查HTML片段中是否包含外部CSS/JS资源
        const linkRegex = /<link[^>]*href=[^>]*>/gi;
        const scriptSrcRegex = /<script[^>]*src=[^>]*><\/script>/gi;
        
        const links = html.match(linkRegex) || [];
        const scripts = html.match(scriptSrcRegex) || [];
        
        // 提取外部资源
        externalResources = [...links, ...scripts].join('\n');
        
        // 移除HTML片段中的外部资源引用，因为我们会把它们放到head中
        let cleanHTML = html.replace(linkRegex, '').replace(scriptSrcRegex, '');
        
        // 检查是否需要Tailwind CDN
        const needsTailwind = html.includes('<!-- NEEDS_TAILWIND -->') || 
                             html.includes('tailwindcss.com') || 
                             html.includes('cdn.tailwindcss.com');
        
        // 移除特殊标记
        cleanHTML = cleanHTML.replace('<!-- NEEDS_TAILWIND -->', '');
        
        // 检测HTML中是否使用了Tailwind类名（更准确的检测）
        const tailwindClassPattern = /class\s*=\s*["'][^"']*(?:bg-|text-|p-|m-|w-|h-|flex|grid|rounded|shadow|border|hover:|focus:|md:|lg:|xl:|sm:|2xl:|space-|divide-|sr-|not-sr|transform|transition|duration-|ease-|delay-|animate-|cursor-|select-|resize|pointer-events|outline|ring|opacity-|visible|invisible|collapse|table|hidden|block|inline|relative|absolute|fixed|sticky|top-|right-|bottom-|left-|z-|overflow|overscroll|truncate|whitespace|break-|font-|leading-|tracking-|uppercase|lowercase|capitalize|normal-case|italic|not-italic|antialiased|subpixel-antialiased)/;
        const usesTailwindClasses = tailwindClassPattern.test(cleanHTML);
        
        // 如果检测到Tailwind使用或有明确标记，自动添加CDN
        const tailwindCDN = 'https://cdn.tailwindcss.com';
        if ((usesTailwindClasses || needsTailwind) && !externalResources.includes(tailwindCDN)) {
          externalResources += `\n<script src="${tailwindCDN}"></script>`;
        }
        
        // 构建完整的HTML文档
        return `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${externalResources}
            <style>${css}</style>
          </head>
          <body>
            ${cleanHTML.replace(/<html[^>]*>|<\/html>|<head[^>]*>.*<\/head>|<body[^>]*>|<\/body>/gis, '')}
            <script>${javascript}</script>
          </body>
          </html>
        `;
      }
    };

    setPreviewContent(generatePreviewContent());
  }, [html, css, javascript]);

  const getViewportClass = () => {
    switch (viewMode) {
      case 'mobile':
        return 'w-[375px] h-[667px]';
      case 'tablet':
        return 'w-[768px] h-[1024px]';
      default:
        return 'w-full h-[600px]';
    }
  };

  const handleRefresh = () => {
    setPreviewContent('');
    setTimeout(() => {
      const generatePreviewContent = () => {
        // 检查HTML是否已经是完整的HTML文档
        const isCompleteHTML = html.includes('<!DOCTYPE html>') || html.includes('<html');
        
        if (isCompleteHTML) {
          // 如果是完整的HTML文档，直接使用，但需要注入额外的CSS和JavaScript
          let completeHTML = html;
          
          // 如果有额外的CSS，注入到head中
          if (css.trim()) {
            const cssTag = `<style>${css}</style>`;
            if (completeHTML.includes('</head>')) {
              completeHTML = completeHTML.replace('</head>', `${cssTag}\n</head>`);
            } else {
              // 如果没有head标签，在html标签后添加
              completeHTML = completeHTML.replace('<html', `<head>${cssTag}</head>\n<html`);
            }
          }
          
          // 如果有额外的JavaScript，注入到body结束前
          if (javascript.trim()) {
            const scriptTag = `<script>${javascript}</script>`;
            if (completeHTML.includes('</body>')) {
              completeHTML = completeHTML.replace('</body>', `${scriptTag}\n</body>`);
            } else {
              // 如果没有body结束标签，在html结束前添加
              completeHTML = completeHTML.replace('</html>', `${scriptTag}\n</html>`);
            }
          }
          
          return completeHTML;
        } else {
          // 如果不是完整的HTML文档，按原逻辑处理
          // 但要检查是否包含外部资源链接
          let externalResources = '';
          
          // 检查HTML片段中是否包含外部CSS/JS资源
          const linkRegex = /<link[^>]*href=[^>]*>/gi;
          const scriptSrcRegex = /<script[^>]*src=[^>]*><\/script>/gi;
          
          const links = html.match(linkRegex) || [];
          const scripts = html.match(scriptSrcRegex) || [];
          
          // 提取外部资源
          externalResources = [...links, ...scripts].join('\n');
          
          // 移除HTML片段中的外部资源引用，因为我们会把它们放到head中
          let cleanHTML = html.replace(linkRegex, '').replace(scriptSrcRegex, '');
          
          // 检查是否需要Tailwind CDN
          const needsTailwind = html.includes('<!-- NEEDS_TAILWIND -->') || 
                               html.includes('tailwindcss.com') || 
                               html.includes('cdn.tailwindcss.com');
          
          // 移除特殊标记
          cleanHTML = cleanHTML.replace('<!-- NEEDS_TAILWIND -->', '');
          
          // 检测HTML中是否使用了Tailwind类名（更准确的检测）
          const tailwindClassPattern = /class\s*=\s*["'][^"']*(?:bg-|text-|p-|m-|w-|h-|flex|grid|rounded|shadow|border|hover:|focus:|md:|lg:|xl:|sm:|2xl:|space-|divide-|sr-|not-sr|transform|transition|duration-|ease-|delay-|animate-|cursor-|select-|resize|pointer-events|outline|ring|opacity-|visible|invisible|collapse|table|hidden|block|inline|relative|absolute|fixed|sticky|top-|right-|bottom-|left-|z-|overflow|overscroll|truncate|whitespace|break-|font-|leading-|tracking-|uppercase|lowercase|capitalize|normal-case|italic|not-italic|antialiased|subpixel-antialiased)/;
          const usesTailwindClasses = tailwindClassPattern.test(cleanHTML);
          
          // 如果检测到Tailwind使用或有明确标记，自动添加CDN
          const tailwindCDN = 'https://cdn.tailwindcss.com';
          if ((usesTailwindClasses || needsTailwind) && !externalResources.includes(tailwindCDN)) {
            externalResources += `\n<script src="${tailwindCDN}"></script>`;
          }
          
          // 构建完整的HTML文档
          return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              ${externalResources}
              <style>${css}</style>
            </head>
            <body>
              ${cleanHTML.replace(/<html[^>]*>|<\/html>|<head[^>]*>.*<\/head>|<body[^>]*>|<\/body>/gis, '')}
              <script>${javascript}</script>
            </body>
            </html>
          `;
        }
      };

      setPreviewContent(generatePreviewContent());
    }, 100);
  };

  const handleOpenNewTab = () => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(previewContent);
      newWindow.document.close();
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-3 bg-muted/50 border-b border-border">
        <h3 className="font-semibold text-foreground">实时预览</h3>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggles */}
          <div className="flex items-center space-x-1 bg-background rounded-lg p-1">
            <Button
              variant={viewMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('desktop')}
              className="h-8 w-8 p-0"
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('tablet')}
              className="h-8 w-8 p-0"
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('mobile')}
              className="h-8 w-8 p-0"
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>

          {/* Control Buttons */}
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleOpenNewTab}>
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="p-4 bg-muted/20 min-h-[400px] flex justify-center">
        <div className={`${getViewportClass()} bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300`}>
          {previewContent && (
            <iframe
              srcDoc={previewContent}
              className="w-full h-full border-0"
              title="Live Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          )}
        </div>
      </div>
    </Card>
  );
};

export default LivePreview;
