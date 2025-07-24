'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/useUserStore';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { CodeEditorTabs } from '@/components/CodeEditorTabs';
import {
  ensureStorageBucket,
  uploadFile,
} from '@/integrations/supabase/storage';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ArrowLeft, Plus, X, Save, Send, Upload, Trash2 } from 'lucide-react';

// 表单验证 schema
const caseSchema = z.object({
  title: z.string().min(1, '请输入案例标题').max(100, '标题不能超过100个字符'),
  description: z
    .string()
    .min(10, '描述至少需要10个字符')
    .max(500, '描述不能超过500个字符'),
  image_url: z.string().optional(), // 改为可选，因为我们用本地状态管理
  category_id: z.string().min(1, '请选择分类'),
  prompt: z
    .string()
    .min(10, '提示词至少需要10个字符')
    .max(1000, '提示词不能超过1000个字符'),
  html_content: z
    .string()
    .min(10, 'HTML内容至少需要10个字符')
    .max(10000, 'HTML内容不能超过10000个字符'),
  css_content: z.string().optional(),
  javascript_content: z.string().optional(),
  preview_url: z.string().optional(),
  tags: z.array(z.string()).max(10, '标签数量不能超过10个'),
});

type CaseFormData = z.infer<typeof caseSchema>;

interface Category {
  id: string;
  name: string;
  name_zh: string;
}

export default function CreateCasePage() {
  const { user } = useAuth();
  const { addUserCase } = useUserStore();
  const { toast } = useToast();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // 添加图片上传相关状态
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [bucketReady, setBucketReady] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string>('');
  const [remoteImageUrl, setRemoteImageUrl] = useState<string>('');

  const form = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      title: '',
      description: '',
      image_url: '',
      category_id: '',
      prompt: '',
      html_content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tailwind CSS Demo</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 flex items-center justify-center h-screen">

    <div class="text-center p-8 bg-white rounded-lg shadow-lg">
      <h1 class="text-4xl font-bold text-blue-600 mb-4">
        Hello, Tailwind CSS!
      </h1>
      <p class="text-gray-700">
        现在你可以直接在 HTML 标签中使用 Tailwind 的功能类了。
      </p>
      <div class="mt-6">
        <a href="#" class="px-5 py-3 bg-indigo-500 text-white font-semibold rounded-md hover:bg-indigo-600 transition duration-300">
          Get Started
        </a>
      </div>
    </div>

</body>
</html>`,
      css_content: '',
      javascript_content: '',
      preview_url: '',
      tags: [],
    },
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchCategories();
    checkStorageBucket();
  }, [user, router]);

  // 清理本地预览URL，避免内存泄漏
  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  // 检查存储桶是否准备就绪
  const checkStorageBucket = async () => {
    try {
      const ready = await ensureStorageBucket('images');
      setBucketReady(ready);
      if (!ready) {
        toast({
          title: '存储桶不存在',
          description: '请在 Supabase 控制台创建 images 存储桶并配置 RLS 策略',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('检查存储桶时出错:', error);
      setBucketReady(false);
    }
  };

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, name_zh')
        .order('created_at');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('获取分类失败:', error);
      toast({
        title: '获取分类失败',
        description: '无法获取分类列表，请稍后再试',
        variant: 'destructive',
      });
    }
  };

  // 处理图片文件选择并自动上传
  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);

      // 立即创建本地预览
      const previewUrl = URL.createObjectURL(file);
      setLocalPreviewUrl(previewUrl);

      // 选择文件后立即上传
      await uploadImage(file);

      // 重置文件输入，允许重复选择相同文件
      e.target.value = '';
    }
  };

  // 上传图片
  const uploadImage = async (file: File) => {
    if (!bucketReady) {
      toast({
        title: '存储未就绪',
        description: '存储系统未准备就绪，请稍后再试',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingImage(true);

      // 使用封装的上传函数
      const result = await uploadFile(file, 'images', 'public');

      // 保存远程图片URL，但不立即更新预览（保持本地预览）
      setRemoteImageUrl(result.fullPath);

      toast({
        title: '上传成功',
        description: '封面图片已成功上传',
      });
    } catch (error: unknown) {
      console.error('上传错误:', error);
      const errorMessage =
        error instanceof Error ? error.message : '图片上传过程中发生错误';
      toast({
        title: '上传失败',
        description: errorMessage,
        variant: 'destructive',
      });
      // 上传失败时清空文件选择
      setImageFile(null);
    } finally {
      setUploadingImage(false);
    }
  };

  // 删除已上传的图片
  const handleRemoveImage = () => {
    // 清理本地预览URL
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    
    setImageFile(null);
    setLocalPreviewUrl('');
    setRemoteImageUrl('');
    form.setValue('image_url', '');
  };

  // 处理拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (uploadingImage || !bucketReady) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // 检查是否为图片文件
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        
        // 立即创建本地预览
        const previewUrl = URL.createObjectURL(file);
        setLocalPreviewUrl(previewUrl);
        
        await uploadImage(file);
      } else {
        toast({
          title: '文件类型错误',
          description: '请选择图片文件（JPG、PNG、GIF）',
          variant: 'destructive',
        });
      }
    }
  };

  // 添加标签
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      const newTags = [...tags, tag];
      setTags(newTags);
      form.setValue('tags', newTags);
      setTagInput('');
    }
  };

  // 移除标签
  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    form.setValue('tags', newTags);
  };

  // 保存草稿
  const saveDraft = async (data: CaseFormData) => {
    if (!user) return;

    // 检查是否有远程图片URL
    if (!remoteImageUrl) {
      toast({
        title: '请等待图片上传完成',
        description: '图片正在上传中，请稍候再试',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const caseData = {
        title: data.title,
        description: data.description,
        image_url: remoteImageUrl, // 使用远程图片URL
        category_id: data.category_id,
        prompt: data.prompt,
        html_content: data.html_content,
        css_content: data.css_content || null,
        javascript_content: data.javascript_content || null,
        preview_url: data.preview_url || null,
        author_id: user.id,
        status: 'draft',
        tags: tags,
      };

      const { data: newCase, error } = await supabase
        .from('cases')
        .insert(caseData)
        .select()
        .single();

      if (error) throw error;

      // 确保数据结构匹配 UserCase 接口
      const userCaseData = {
        id: newCase.id,
        title: newCase.title,
        description: newCase.description || '',
        image_url: newCase.image_url,
        view_count: newCase.view_count || 0,
        like_count: newCase.like_count || 0,
        status: newCase.status,
        created_at: newCase.created_at,
        tags: newCase.tags || [],
      };

      addUserCase(userCaseData);

      toast({
        title: '草稿保存成功',
        description: '您可以在个人中心继续编辑',
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('保存草稿失败:', error);
      toast({
        title: '保存草稿失败',
        description: '无法保存草稿，请稍后再试',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 发布案例
  const publishCase = async (data: CaseFormData) => {
    if (!user) return;

    // 检查是否有远程图片URL
    if (!remoteImageUrl) {
      toast({
        title: '请等待图片上传完成',
        description: '图片正在上传中，请稍候再试',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const caseData = {
        title: data.title,
        description: data.description,
        image_url: remoteImageUrl, // 使用远程图片URL
        category_id: data.category_id,
        prompt: data.prompt,
        html_content: data.html_content,
        css_content: data.css_content || null,
        javascript_content: data.javascript_content || null,
        preview_url: data.preview_url || null,
        author_id: user.id,
        status: 'approval',
        tags: tags,
      };

      const { data: newCase, error } = await supabase
        .from('cases')
        .insert(caseData)
        .select()
        .single();

      if (error) throw error;

      // 确保数据结构匹配 UserCase 接口
      const userCaseData = {
        id: newCase.id,
        title: newCase.title,
        description: newCase.description || '',
        image_url: newCase.image_url,
        view_count: newCase.view_count || 0,
        like_count: newCase.like_count || 0,
        status: newCase.status,
        created_at: newCase.created_at,
        tags: newCase.tags || [],
      };

      addUserCase(userCaseData);

      toast({
        title: '提交审核成功',
        description: '案例已提交审核，审核通过后将在首页展示',
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('发布案例失败:', error);
      toast({
        title: '发布失败',
        description: '无法发布案例，请稍后再试',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">创建新案例</h1>
              <p className="text-muted-foreground">
                分享您的创意设计和代码实现
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form className="space-y-8">
            {/* 基本信息卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
                <CardDescription>填写案例的基本信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>案例标题 *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例如：毛玻璃风格仪表板设计"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>案例描述 *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="详细描述您的案例设计理念、特色功能或实现思路..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        详细描述有助于其他用户更好地理解您的设计
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>封面图片 *</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {/* 已上传图片预览或上传区域 */}
                          {localPreviewUrl ? (
                            <div className="relative inline-block">
                              <img
                                src={localPreviewUrl}
                                alt="封面预览"
                                className="w-full max-w-sm h-auto rounded-md border border-gray-200"
                              />
                              <div className="absolute top-2 right-2 flex gap-2">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    // 触发文件选择
                                    const input = document.getElementById(
                                      'cover-image-input'
                                    ) as HTMLInputElement;
                                    if (input) {
                                      input.click();
                                    }
                                  }}
                                  disabled={uploadingImage}
                                  className="shadow-sm"
                                >
                                  <Upload className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={handleRemoveImage}
                                  disabled={uploadingImage}
                                  className="shadow-sm"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              {uploadingImage && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
                                  <div className="text-white text-sm">
                                    上传中...
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div
                              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                                dragOver
                                  ? 'border-blue-400 bg-blue-50'
                                  : 'border-gray-300 hover:border-gray-400'
                              } ${
                                uploadingImage
                                  ? 'opacity-50 cursor-not-allowed'
                                  : ''
                              }`}
                              onClick={() => {
                                if (!uploadingImage && bucketReady) {
                                  const input = document.getElementById(
                                    'cover-image-input'
                                  ) as HTMLInputElement;
                                  if (input) {
                                    input.click();
                                  }
                                }
                              }}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                            >
                              {uploadingImage ? (
                                <div className="text-gray-500">
                                  <Upload className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                                  <p>上传中...</p>
                                </div>
                              ) : (
                                <div
                                  className={`${
                                    dragOver ? 'text-blue-600' : 'text-gray-500'
                                  }`}
                                >
                                  <Upload className="h-8 w-8 mx-auto mb-2" />
                                  <p className="text-sm">
                                    {dragOver
                                      ? '释放鼠标上传图片'
                                      : '点击选择图片或拖拽图片到此处'}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    支持 JPG、PNG、GIF 格式，单张图片
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 隐藏的文件输入 */}
                          <Input
                            id="cover-image-input"
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            disabled={uploadingImage || !bucketReady}
                            className="hidden"
                          />

                          {/* 存储桶状态提示 */}
                          {!bucketReady && (
                            <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                              存储桶不存在，请先在 Supabase 控制台创建 images
                              存储桶
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        建议使用高质量的设计截图作为封面，选择图片后会自动上传
                      </FormDescription>
                      {!localPreviewUrl && (
                        <p className="text-sm text-red-500">请上传封面图片</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>分类 *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择分类" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name_zh}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preview_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>预览链接</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="在线预览链接（可选）"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          可提供CodePen、JSFiddle等在线预览
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 内容详情卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>内容详情</CardTitle>
                <CardDescription>添加设计思路和提示词</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>设计提示 *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="请描述您的设计理念、灵感来源或给其他用户的设计建议..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        分享您的设计思路，帮助其他用户理解和学习
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 代码编辑器卡片 */}
            <CodeEditorTabs
              html={form.watch('html_content')}
              css={form.watch('css_content') || ''}
              javascript={form.watch('javascript_content') || ''}
              onHtmlChange={(value) => form.setValue('html_content', value)}
              onCssChange={(value) => form.setValue('css_content', value)}
              onJavascriptChange={(value) =>
                form.setValue('javascript_content', value)
              }
              showPreview={true}
            />

            {/* 标签卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>标签</CardTitle>
                <CardDescription>
                  添加相关标签，便于其他用户发现
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="输入标签，按回车添加"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    disabled={!tagInput.trim() || tags.length >= 10}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  已添加 {tags.length}/10 个标签
                </p>
              </CardContent>
            </Card>

            {/* 提交按钮 */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={form.handleSubmit(saveDraft)}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                保存草稿
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit(publishCase)}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                提交审核
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}