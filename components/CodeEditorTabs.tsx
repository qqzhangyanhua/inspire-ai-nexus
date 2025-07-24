import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Eye, Code, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// 声明html2canvas类型
declare global {
  interface Window {
    html2canvas: (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
  }
}

interface CodeEditorTabsProps {
  html: string;
  css: string;
  javascript: string;
  onHtmlChange: (value: string) => void;
  onCssChange: (value: string) => void;
  onJavascriptChange: (value: string) => void;
  showPreview?: boolean;
}

export const CodeEditorTabs: React.FC<CodeEditorTabsProps> = ({
  html,
  css,
  javascript,
  onHtmlChange,
  onCssChange,
  onJavascriptChange,
  showPreview = true,
}) => {
  const [previewMode, setPreviewMode] = useState<'code' | 'preview'>('code');
  const [isCapturing, setIsCapturing] = useState(false);
  const [html2canvasLoaded, setHtml2canvasLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  // 加载html2canvas库
  const loadHtml2Canvas = () => {
    if (window.html2canvas || html2canvasLoaded) {
      setHtml2canvasLoaded(true);
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = () => {
        setHtml2canvasLoaded(true);
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load html2canvas'));
      };
      document.head.appendChild(script);
    });
  };

  // 截图功能
  const captureScreenshot = async () => {
    if (!iframeRef.current) {
      toast({
        title: '截图失败',
        description: '预览区域未找到',
        variant: 'destructive',
      });
      return;
    }

    setIsCapturing(true);

    try {
      // 加载html2canvas库
      await loadHtml2Canvas();

      // 获取iframe的内容文档
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('无法访问iframe内容');
      }

      // 对iframe的body进行截图
      const canvas = await window.html2canvas(iframeDoc.body, {
        useCORS: true,
        allowTaint: true,
        scale: 2, // 提高截图质量
        backgroundColor: '#ffffff',
        width: iframeDoc.body.scrollWidth,
        height: iframeDoc.body.scrollHeight,
      });

      // 创建下载链接
      const link = document.createElement('a');
      link.download = `preview-screenshot-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: '截图成功',
        description: '预览截图已保存到下载文件夹',
      });
    } catch (error) {
      console.error('截图失败:', error);
      toast({
        title: '截图失败',
        description: error instanceof Error ? error.message : '截图过程中发生错误',
        variant: 'destructive',
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const generatePreviewContent = () => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <style>
        body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
        ${css}
    </style>
</head>
<body>
    ${html}
    <script>
        ${javascript}
    </script>
</body>
</html>
    `.trim();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>代码内容</CardTitle>
        {showPreview && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant={previewMode === 'code' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('code')}
              className="flex items-center gap-2"
            >
              <Code className="h-4 w-4" />
              编辑
            </Button>
            <Button
              type="button"
              variant={previewMode === 'preview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('preview')}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              预览
            </Button>
            {previewMode === 'preview' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={captureScreenshot}
                disabled={isCapturing}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                {isCapturing ? '截图中...' : '截图'}
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {previewMode === 'code' ? (
          <Tabs defaultValue="html" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="css">CSS</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            </TabsList>
            
            <TabsContent value="html" className="mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  HTML 结构
                </label>
                <Textarea
                  placeholder="请输入HTML代码..."
                  value={html}
                  onChange={(e) => onHtmlChange(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="css" className="mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  CSS 样式
                </label>
                <Textarea
                  placeholder="请输入CSS样式代码..."
                  value={css}
                  onChange={(e) => onCssChange(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="javascript" className="mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  JavaScript 逻辑
                </label>
                <Textarea
                  placeholder="请输入JavaScript代码..."
                  value={javascript}
                  onChange={(e) => onJavascriptChange(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted p-2 text-sm text-muted-foreground">
              实时预览
            </div>
            <div className="relative">
              <iframe
                ref={iframeRef}
                srcDoc={generatePreviewContent()}
                className="w-full h-[400px] border-0"
                sandbox="allow-scripts allow-same-origin"
                title="代码预览"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};