'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, Wand2, Settings, Eye, Copy, Download, Loader2, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { copyToClipboard } from '@/lib/utils';

interface AIConfig {
  baseUrl: string;
  apiKey: string;
}

interface GeneratedResult {
  html: string;
  prompt: string;
  description: string;
}

export default function AIToolsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig>({ baseUrl: '', apiKey: '' });

  // 从localStorage加载AI配置
  useEffect(() => {
    const savedConfig = localStorage.getItem('ai-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setAiConfig(config);
      } catch (error) {
        console.error('Failed to parse saved AI config:', error);
      }
    }
  }, []);

  // 保存AI配置到localStorage
  const saveAiConfig = (config: AIConfig) => {
    setAiConfig(config);
    localStorage.setItem('ai-config', JSON.stringify(config));
  };
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  
  // 图片转HTML状态
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageResult, setImageResult] = useState<GeneratedResult | null>(null);
  
  // 提示词转HTML状态
  const [promptText, setPromptText] = useState('');
  const [promptResult, setPromptResult] = useState<GeneratedResult | null>(null);

  // 检查用户是否登录
  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  // 处理图片上传
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 图片转HTML
  const generateFromImage = async () => {
    if (!selectedImage || !aiConfig.apiKey || !aiConfig.baseUrl) {
      toast({
        title: '配置不完整',
        description: '请先上传图片并配置AI设置',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/image-to-html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imagePreview,
          config: aiConfig,
        }),
      });

      if (!response.ok) {
        throw new Error('生成失败');
      }

      const result = await response.json();
      setImageResult(result);
      
      toast({
        title: '生成成功',
        description: 'HTML代码已生成完成',
      });
    } catch (error) {
      console.error('生成失败:', error);
      toast({
        title: '生成失败',
        description: '请检查配置并重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 提示词转HTML
  const generateFromPrompt = async () => {
    if (!promptText.trim() || !aiConfig.apiKey || !aiConfig.baseUrl) {
      toast({
        title: '配置不完整',
        description: '请输入提示词并配置AI设置',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/prompt-to-html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptText,
          config: aiConfig,
        }),
      });

      if (!response.ok) {
        throw new Error('生成失败');
      }

      const result = await response.json();
      setPromptResult(result);
      
      toast({
        title: '生成成功',
        description: 'HTML代码已生成完成',
      });
    } catch (error) {
      console.error('生成失败:', error);
      toast({
        title: '生成失败',
        description: '请检查配置并重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 复制文本到剪贴板
  const handleCopyToClipboard = async (text: string, type: string) => {
    const success = await copyToClipboard(text);
    
    if (success) {
      toast({
        title: '复制成功',
        description: `${type}已复制到剪贴板`,
      });
    } else {
      toast({
        title: '复制失败',
        description: '请手动选择并复制内容',
        variant: 'destructive',
      });
    }
  };

  // 在新窗口中打开预览
  const openInNewWindow = (html: string) => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    }
  };

  // 代码块组件
  const CodeBlock = ({ code, language }: { code: string; language: string }) => (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleCopyToClipboard(code, language)}
        className="absolute right-2 top-2 z-10 bg-background/80 hover:bg-background"
      >
        <Copy className="w-4 h-4 mr-1" />
        复制
      </Button>
      <SyntaxHighlighter
        language="markup"
        style={vscDarkPlus}
        className="!bg-slate-950 !text-slate-100 !p-4 !rounded-lg !text-sm !font-mono !max-h-96 !overflow-y-auto"
        customStyle={{
          margin: 0,
          borderRadius: "0.5rem",
          maxHeight: "384px",
          fontSize: "0.875rem",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );

  // 文本块组件（用于提示词和说明）
  const TextBlock = ({ text, label }: { text: string; label: string }) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-medium">{label}</Label>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleCopyToClipboard(text, label)}
        >
          <Copy className="h-3 w-3 mr-1" />
          复制
        </Button>
      </div>
      <div className="mt-1 p-3 bg-muted rounded-lg text-sm max-h-32 overflow-y-auto">
        {text}
      </div>
    </div>
  );

  // 下载HTML文件
  const downloadHTML = (html: string, filename: string) => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">AI 工具箱</h1>
            <p className="text-muted-foreground">使用AI技术将图片或提示词转换为Tailwind CSS组成的HTML代码</p>
          </div>
          
          <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                AI 配置
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>AI 配置</DialogTitle>
                <DialogDescription>
                  配置您的OpenAI API设置
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input
                    id="baseUrl"
                    placeholder="https://api.openai.com/v1"
                    value={aiConfig.baseUrl}
                    onChange={(e) => saveAiConfig({ ...aiConfig, baseUrl: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={aiConfig.apiKey}
                    onChange={(e) => saveAiConfig({ ...aiConfig, apiKey: e.target.value })}
                  />
                </div>
                <Button 
                  onClick={() => setConfigDialogOpen(false)}
                  className="w-full"
                >
                  保存配置
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="image-to-html" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="image-to-html">图片转HTML</TabsTrigger>
            <TabsTrigger value="prompt-to-html">提示词转HTML</TabsTrigger>
          </TabsList>

          {/* 图片转HTML */}
          <TabsContent value="image-to-html" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 输入区域 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    上传图片
                  </CardTitle>
                  <CardDescription>
                    上传一张UI设计图，AI将为您生成对应的HTML代码
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img 
                          src={imagePreview} 
                          alt="预览" 
                          className="max-w-full max-h-64 mx-auto rounded-lg"
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview('');
                          }}
                        >
                          重新选择
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            点击选择图片或拖拽到此处
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          <Label htmlFor="image-upload" className="cursor-pointer">
                            <Button variant="outline" asChild>
                              <span>选择图片</span>
                            </Button>
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={generateFromImage}
                    disabled={!selectedImage || loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        生成HTML
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* 结果区域 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    生成结果
                  </CardTitle>
                  <CardDescription>
                    生成的HTML代码和相关说明
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {imageResult ? (
                    <div className="space-y-4">
                      <TextBlock text={imageResult.prompt} label="生成的提示词" />
                      
                      <TextBlock text={imageResult.description} label="说明" />
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium">HTML代码</Label>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => downloadHTML(imageResult.html, 'generated-from-image')}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              下载
                            </Button>
                          </div>
                        </div>
                        <CodeBlock code={imageResult.html} language="HTML代码" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium">预览</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openInNewWindow(imageResult.html)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            新窗口打开
                          </Button>
                        </div>
                        <div className="border rounded-lg p-4 bg-white">
                          <iframe 
                            srcDoc={imageResult.html}
                            className="w-full h-80 border-0"
                            title="预览"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>上传图片并点击生成按钮开始</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 提示词转HTML */}
          <TabsContent value="prompt-to-html" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 输入区域 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    输入提示词
                  </CardTitle>
                  <CardDescription>
                    描述您想要的UI界面，AI将为您生成对应的HTML代码
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="prompt">提示词</Label>
                    <Textarea
                      id="prompt"
                      placeholder="例如：创建一个现代化的登录页面，包含用户名和密码输入框，以及一个蓝色的登录按钮..."
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      rows={8}
                      className="mt-1"
                    />
                  </div>
                  
                  <Button 
                    onClick={generateFromPrompt}
                    disabled={!promptText.trim() || loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        生成HTML
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* 结果区域 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    生成结果
                  </CardTitle>
                  <CardDescription>
                    生成的HTML代码和相关说明
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {promptResult ? (
                    <div className="space-y-4">
                      <TextBlock text={promptResult.prompt} label="优化后的提示词" />
                      
                      <TextBlock text={promptResult.description} label="说明" />
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium">HTML代码</Label>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => downloadHTML(promptResult.html, 'generated-from-prompt')}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              下载
                            </Button>
                          </div>
                        </div>
                        <CodeBlock code={promptResult.html} language="HTML代码" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium">预览</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openInNewWindow(promptResult.html)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            新窗口打开
                          </Button>
                        </div>
                        <div className="border rounded-lg p-4 bg-white">
                          <iframe 
                            srcDoc={promptResult.html}
                            className="w-full h-80 border-0"
                            title="预览"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>输入提示词并点击生成按钮开始</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}