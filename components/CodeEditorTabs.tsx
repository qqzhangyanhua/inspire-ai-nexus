import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Eye, Code } from 'lucide-react';

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