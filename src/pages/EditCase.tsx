"use client"

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/stores/useUserStore";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { CodeEditorTabs } from "@/components/CodeEditorTabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Plus, X, Save, Send, Loader2 } from "lucide-react";

// 表单验证 schema
const caseSchema = z.object({
  title: z.string().min(1, "请输入案例标题").max(100, "标题不能超过100个字符"),
  description: z.string().min(10, "描述至少需要10个字符").max(500, "描述不能超过500个字符"),
  image_url: z.string().url("请输入有效的图片链接"),
  category_id: z.string().min(1, "请选择分类"),
  prompt: z.string().min(10, "提示词至少需要10个字符").max(1000, "提示词不能超过1000个字符"),
  html_content: z.string().min(10, "HTML内容至少需要10个字符").max(10000, "HTML内容不能超过10000个字符"),
  css_content: z.string().optional(),
  javascript_content: z.string().optional(),
  preview_url: z.string().optional(),
  tags: z.array(z.string()).max(10, "标签数量不能超过10个"),
});

type CaseFormData = z.infer<typeof caseSchema>;

interface Category {
  id: string;
  name: string;
  name_zh: string;
}

interface CaseData {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category_id: string;
  prompt: string;
  html_content: string;
  css_content: string | null;
  javascript_content: string | null;
  preview_url: string | null;
  tags: string[];
  status: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
}

const EditCase = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { updateUserCase } = useUserStore();
  const { toast } = useToast();
  const navigate = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [caseData, setCaseData] = useState<CaseData | null>(null);

  const form = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      title: "",
      description: "",
      image_url: "",
      category_id: "",
      prompt: "",
      html_content: "",
      css_content: "",
      javascript_content: "",
      preview_url: "",
      tags: [],
    },
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    
    if (!id) {
      router.push('/dashboard');
      return;
    }

    fetchCaseData();
    fetchCategories();
  }, [user, id, navigate]);

  // 获取案例数据
  const fetchCaseData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      
      const { data: caseInfo, error } = await supabase
        .from('cases')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('获取案例数据失败:', error);
        toast({
          title: "获取失败",
          description: "无法获取案例数据，请稍后再试",
          variant: "destructive",
        });
        router.push('/dashboard');
        return;
      }

      if (!caseInfo) {
        toast({
          title: "案例不存在",
          description: "该案例可能已被删除或不存在",
          variant: "destructive",
        });
        router.push('/dashboard');
        return;
      }

      // 检查权限 - 只有案例作者可以编辑
      if (caseInfo.author_id !== user?.id) {
        toast({
          title: "无权限编辑",
          description: "您只能编辑自己创建的案例",
          variant: "destructive",
        });
        router.push('/dashboard');
        return;
      }

      setCaseData(caseInfo);
      
      // 设置表单默认值
      const formData = {
        title: caseInfo.title,
        description: caseInfo.description || "",
        image_url: caseInfo.image_url,
        category_id: caseInfo.category_id || "",
        prompt: caseInfo.prompt || "",
        html_content: caseInfo.html_content || "",
        css_content: caseInfo.css_content || "",
        javascript_content: caseInfo.javascript_content || "",
        preview_url: caseInfo.preview_url || "",
        tags: caseInfo.tags || [],
      };

      // 重置表单并设置新的默认值
      form.reset(formData);
      setTags(caseInfo.tags || []);

    } catch (error) {
      console.error('获取案例数据失败:', error);
      toast({
        title: "获取失败",
        description: "网络错误，请检查网络连接",
        variant: "destructive",
      });
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
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
        title: "获取分类失败",
        description: "无法获取分类列表，请稍后再试",
        variant: "destructive",
      });
    }
  };

  // 添加标签
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      const newTags = [...tags, tag];
      setTags(newTags);
      form.setValue('tags', newTags);
      setTagInput("");
    }
  };

  // 移除标签
  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    form.setValue('tags', newTags);
  };

  // 更新为草稿
  const saveDraft = async (data: CaseFormData) => {
    if (!user || !id) return;

    setIsSubmitting(true);
    try {
      const updateData = {
        title: data.title,
        description: data.description,
        image_url: data.image_url,
        category_id: data.category_id,
        prompt: data.prompt,
        html_content: data.html_content,
        css_content: data.css_content || null,
        javascript_content: data.javascript_content || null,
        preview_url: data.preview_url || null,
        status: 'draft',
        tags: tags,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('cases')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // 更新本地store中的数据
      updateUserCase(id, {
        title: data.title,
        description: data.description,
        image_url: data.image_url,
        status: 'draft',
        tags: tags,
      });
      
      toast({
        title: "草稿保存成功",
        description: "案例已保存为草稿",
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('保存草稿失败:', error);
      toast({
        title: "保存草稿失败",
        description: "无法保存草稿，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 发布案例
  const publishCase = async (data: CaseFormData) => {
    if (!user || !id) return;

    setIsSubmitting(true);
    try {
      const updateData = {
        title: data.title,
        description: data.description,
        image_url: data.image_url,
        category_id: data.category_id,
        prompt: data.prompt,
        html_content: data.html_content,
        css_content: data.css_content || null,
        javascript_content: data.javascript_content || null,
        preview_url: data.preview_url || null,
        status: 'published',
        tags: tags,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('cases')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // 更新本地store中的数据
      updateUserCase(id, {
        title: data.title,
        description: data.description,
        image_url: data.image_url,
        status: 'published',
        tags: tags,
      });
      
      toast({
        title: "发布成功",
        description: "案例已成功发布",
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('发布案例失败:', error);
      toast({
        title: "发布失败",
        description: "无法发布案例，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">加载案例数据中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-background">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">案例不存在</h1>
            <p className="text-muted-foreground">该案例可能已被删除或不存在</p>
            <Button onClick={() => router.push('/dashboard')} className="mt-4">
              返回控制台
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-foreground">编辑案例</h1>
              <p className="text-muted-foreground">修改您的创意设计和代码实现</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form className="space-y-8">
            {/* 基本信息卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
                <CardDescription>修改案例的基本信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>案例标题 *</FormLabel>
                      <FormControl>
                        <Input placeholder="例如：毛玻璃风格仪表板设计" {...field} />
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
                        <Input placeholder="请输入图片链接" {...field} />
                      </FormControl>
                      <FormDescription>
                        建议使用高质量的设计截图作为封面
                      </FormDescription>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                          <Input placeholder="在线预览链接（可选）" {...field} />
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
                <CardDescription>修改设计思路和提示词</CardDescription>
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
              onJavascriptChange={(value) => form.setValue('javascript_content', value)}
              showPreview={true}
            />

            {/* 标签卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>标签</CardTitle>
                <CardDescription>修改相关标签，便于其他用户发现</CardDescription>
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
                  <Button type="button" onClick={addTag} disabled={!tagInput.trim() || tags.length >= 10}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-2">
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
                {caseData.status === 'published' ? '更新发布' : '立即发布'}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
};

export default EditCase; 