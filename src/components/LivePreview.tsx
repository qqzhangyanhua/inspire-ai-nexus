
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
    const fullContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${css}</style>
      </head>
      <body>
        ${html.replace(/<html[^>]*>|<\/html>|<head[^>]*>.*<\/head>|<body[^>]*>|<\/body>/gis, '')}
        <script>${javascript}</script>
      </body>
      </html>
    `;
    setPreviewContent(fullContent);
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
      const fullContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${css}</style>
        </head>
        <body>
          ${html.replace(/<html[^>]*>|<\/html>|<head[^>]*>.*<\/head>|<body[^>]*>|<\/body>/gis, '')}
          <script>${javascript}</script>
        </body>
        </html>
      `;
      setPreviewContent(fullContent);
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
        <h3 className="font-semibold text-foreground">Live Preview</h3>
        
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
