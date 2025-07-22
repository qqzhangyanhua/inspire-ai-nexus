import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/stores/useUserStore";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Plus, X, Save, Send } from "lucide-react";

// 表单验证 schema
const caseSchema = z.object({
  title: z.string().min(1, "请输入案例标题").max(100, "标题不能超过100个字符"),
  description: z.string().min(10, "描述至少需要10个字符").max(500, "描述不能超过500个字符"),
  image_url: z.string().url("请输入有效的图片链接"),
  category_id: z.string().min(1, "请选择分类"),
  prompt: z.string().min(10, "提示词至少需要10个字符").max(1000, "提示词不能超过1000个字符"),
  code_content: z.string().min(10, "代码内容至少需要10个字符").max(10000, "代码内容不能超过10000个字符"),
  preview_url: z.string().optional(),
  tags: z.array(z.string()).max(10, "标签数量不能超过10个"),
});

type CaseFormData = z.infer<typeof caseSchema>;

interface Category {
  id: string;
  name: string;
  name_zh: string;
}

const CreateCase = () => {
  const { user } = useAuth();
  const { addUserCase } = useUserStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      title: "",
      description: "",
      image_url: "",
      category_id: "",
      prompt: "",
      code_content: "",
      preview_url: "",
      tags: [],
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCategories();
  }, [user, navigate]);

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

  // 保存草稿
  const saveDraft = async (data: CaseFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const caseData = {
        title: data.title,
        description: data.description,
        image_url: data.image_url,
        category_id: data.category_id,
        prompt: data.prompt,
        code_content: data.code_content,
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
        description: newCase.description || "",
        image_url: newCase.image_url,
        view_count: newCase.view_count || 0,
        like_count: newCase.like_count || 0,
        status: newCase.status,
        created_at: newCase.created_at,
        tags: newCase.tags || [],
      };

      addUserCase(userCaseData);
      
      toast({
        title: "草稿保存成功",
        description: "您可以在个人中心继续编辑",
      });

      navigate('/dashboard');
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
    if (!user) return;

    setIsSubmitting(true);
    try {
      const caseData = {
        title: data.title,
        description: data.description,
        image_url: data.image_url,
        category_id: data.category_id,
        prompt: data.prompt,
        code_content: data.code_content,
        preview_url: data.preview_url || null,
        author_id: user.id,
        status: 'published',
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
        description: newCase.description || "",
        image_url: newCase.image_url,
        view_count: newCase.view_count || 0,
        like_count: newCase.like_count || 0,
        status: newCase.status,
        created_at: newCase.created_at,
        tags: newCase.tags || [],
      };

      addUserCase(userCaseData);
      
      toast({
        title: "发布成功",
        description: "案例已成功发布",
      });

      navigate('/dashboard');
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

  return (
    <div className="min-h-screen bg-background">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">创建新案例</h1>
              <p className="text-muted-foreground">分享您的创意设计和代码实现</p>
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
                              <SelectValue placeholder="选择案例分类" />
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
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>预览图片 *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/image.jpg"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          请提供案例的预览图片链接
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="preview_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>在线预览链接</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/demo (可选)"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        如果有在线演示，请提供链接
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 内容详情卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>内容详情</CardTitle>
                <CardDescription>提供具体的实现内容</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>提示词 *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="描述如何创建这个设计的提示词，包括设计要求、技术栈、实现思路等..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        详细的提示词有助于其他用户学习和复现
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code_content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>代码内容 *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="请粘贴您的代码实现..."
                          className="min-h-[300px] font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        包含HTML、CSS、JavaScript等相关代码
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 标签卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>标签</CardTitle>
                <CardDescription>添加相关标签，便于其他用户发现</CardDescription>
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
                立即发布
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
};

export default CreateCase;