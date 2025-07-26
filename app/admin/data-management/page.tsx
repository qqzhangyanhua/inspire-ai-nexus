'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/useUserStore';
import { supabase } from '@/integrations/supabase/client';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Calendar, Eye, Heart, Search, Filter, RefreshCw, User, Star, Image, Code, Link } from 'lucide-react';

interface CaseData {
  id: string;
  title: string;
  description: string;
  image_url: string;
  view_count: number;
  like_count: number;
  status: string;
  created_at: string;
  tags: string[];
  author_id: string;
  category_id?: string;
  prompt?: string;
  code_content?: string;
  html_content?: string;
  css_content?: string;
  javascript_content?: string;
  preview_url?: string;
  is_featured: boolean;
  profiles?: {
    display_name?: string;
    username?: string;
  };
  categories?: {
    id: string;
    name_zh: string;
  };
}

interface EditFormData {
  title: string;
  description: string;
  image_url: string;
  tags: string;
  status: string;
  category_id: string;
  prompt: string;
  preview_url: string;
  is_featured: boolean;
  author_id: string;
  html_content: string;
  css_content: string;
  javascript_content: string;
}

interface Category {
  id: string;
  name_zh: string;
  name: string;
}

interface UserProfile {
  user_id: string;
  display_name?: string;
  username?: string;
}

export default function DataManagementPage() {
  const { user } = useAuth();
  const { profile } = useUserStore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [cases, setCases] = useState<CaseData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<CaseData | null>(null);
  const [editForm, setEditForm] = useState<EditFormData>({
    title: '',
    description: '',
    image_url: '',
    tags: '',
    status: '',
    category_id: 'none',
    prompt: '',
    preview_url: '',
    is_featured: false,
    author_id: 'none',
    html_content: '',
    css_content: '',
    javascript_content: ''
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 权限检查
  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    
    if (profile && profile.role !== 'Admin') {
      toast({
        title: '权限不足',
        description: '您没有权限访问数据管理页面',
        variant: 'destructive',
      });
      router.push('/dashboard');
      return;
    }
    
    if (profile?.role === 'Admin') {
      fetchCases();
      fetchCategories();
      fetchUsers();
    }
  }, [user, profile, router]);

  // 获取所有案例数据
  const fetchCases = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          profiles!cases_author_id_fkey(
            display_name,
            username
          ),
          categories!cases_category_id_fkey(
            id,
            name_zh
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('获取案例数据失败:', error);
      toast({
        title: '获取数据失败',
        description: '无法加载案例数据，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取分类数据
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, name_zh')
        .order('name_zh');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('获取分类数据失败:', error);
    }
  };

  // 获取用户数据
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, username')
        .order('display_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('获取用户数据失败:', error);
    }
  };

  // 搜索和过滤
  const filteredCases = cases.filter(case_ => {
    const matchesSearch = !searchQuery || 
      case_.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || case_.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // 打开编辑对话框
  const handleEdit = (case_: CaseData) => {
    setEditingCase(case_);
    setEditForm({
      title: case_.title,
      description: case_.description || '',
      image_url: case_.image_url,
      tags: case_.tags?.join(', ') || '',
      status: case_.status,
      category_id: case_.category_id || 'none',
      prompt: case_.prompt || '',
      preview_url: case_.preview_url || '',
      is_featured: case_.is_featured || false,
      author_id: case_.author_id || 'none',
      html_content: case_.html_content || '',
      css_content: case_.css_content || '',
      javascript_content: case_.javascript_content || ''
    });
    setEditDialogOpen(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingCase) return;

    try {
      const tagsArray = editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const updateData = {
        title: editForm.title,
        description: editForm.description,
        image_url: editForm.image_url,
        tags: tagsArray,
        status: editForm.status,
        category_id: editForm.category_id === 'none' ? null : editForm.category_id,
        prompt: editForm.prompt,
        preview_url: editForm.preview_url,
        is_featured: editForm.is_featured,
        author_id: editForm.author_id === 'none' ? null : editForm.author_id,
        html_content: editForm.html_content,
        css_content: editForm.css_content,
        javascript_content: editForm.javascript_content
      };
      
      const { error } = await supabase
        .from('cases')
        .update(updateData)
        .eq('id', editingCase.id);

      if (error) throw error;

      // 更新本地数据
      setCases(prev => prev.map(case_ => 
        case_.id === editingCase.id 
          ? { ...case_, ...updateData }
          : case_
      ));

      setEditDialogOpen(false);
      toast({
        title: '修改成功',
        description: '案例信息已更新',
      });
    } catch (error) {
      console.error('修改失败:', error);
      toast({
        title: '修改失败',
        description: '无法保存修改，请稍后重试',
        variant: 'destructive',
      });
    }
  };

  // 删除案例
  const handleDelete = async (caseId: string) => {
    try {
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseId);

      if (error) throw error;

      setCases(prev => prev.filter(case_ => case_.id !== caseId));
      toast({
        title: '删除成功',
        description: '案例已被删除',
      });
    } catch (error) {
      console.error('删除失败:', error);
      toast({
        title: '删除失败',
        description: '无法删除案例，请稍后重试',
        variant: 'destructive',
      });
    }
  };

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    const statusMap = {
      published: { label: '已发布', variant: 'default' as const },
      draft: { label: '草稿', variant: 'secondary' as const },
      approval: { label: '待审批', variant: 'outline' as const },
      rejected: { label: '已拒绝', variant: 'destructive' as const }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.published;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (!user || !profile) return null;

  if (profile.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-background">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">权限不足</h1>
            <p className="text-muted-foreground">您没有权限访问此页面</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">数据管理</h1>
            <p className="text-muted-foreground">管理所有用户提交的案例数据</p>
          </div>
          <Button onClick={() => {
            fetchCases();
            fetchCategories();
            fetchUsers();
          }} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>案例管理</CardTitle>
            <CardDescription>查看、编辑和管理所有用户案例</CardDescription>
            
            {/* 搜索和过滤器 */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索标题、描述或标签..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="状态筛选" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="approval">待审批</SelectItem>
                    <SelectItem value="rejected">已拒绝</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">加载中...</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>预览图</TableHead>
                      <TableHead>标题</TableHead>
                      <TableHead>分类</TableHead>
                      <TableHead>作者</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>特色</TableHead>
                      <TableHead>数据</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <p className="text-muted-foreground">
                            {searchQuery || statusFilter !== 'all' ? '没有找到匹配的案例' : '暂无案例数据'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCases.map((case_) => (
                        <TableRow key={case_.id}>
                          <TableCell>
                            <div className="w-16 h-12 bg-muted rounded overflow-hidden">
                              <img 
                                src={case_.image_url} 
                                alt={case_.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-48">
                              <p className="font-medium truncate">{case_.title}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {case_.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {case_.categories?.name_zh || '未分类'}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {case_.profiles?.display_name || case_.profiles?.username || '未知用户'}
                            </p>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(case_.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {case_.is_featured && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  精选
                                </Badge>
                              )}
                              {case_.preview_url && (
                                <Badge variant="outline" className="text-xs">
                                  <Link className="h-3 w-3 mr-1" />
                                  预览
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {case_.view_count || 0}
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {case_.like_count || 0}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {new Date(case_.created_at).toLocaleDateString('zh-CN')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(case_)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>确认删除</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      您确定要删除案例「{case_.title}」吗？此操作无法撤销。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(case_.id)}>
                                      删除
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 编辑对话框 */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>编辑案例</DialogTitle>
              <DialogDescription>
                修改案例的所有属性和内容
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">基本信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">标题</Label>
                    <Input
                      id="title"
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="输入案例标题"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">状态</Label>
                    <Select
                      value={editForm.status}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">已发布</SelectItem>
                        <SelectItem value="draft">草稿</SelectItem>
                        <SelectItem value="approval">待审批</SelectItem>
                        <SelectItem value="rejected">已拒绝</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="输入案例描述"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="image_url">预览图 URL</Label>
                    <Input
                      id="image_url"
                      value={editForm.image_url}
                      onChange={(e) => setEditForm(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="输入图片链接"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="preview_url">预览链接</Label>
                    <Input
                      id="preview_url"
                      value={editForm.preview_url}
                      onChange={(e) => setEditForm(prev => ({ ...prev, preview_url: e.target.value }))}
                      placeholder="输入预览链接"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">分类</Label>
                    <Select
                      value={editForm.category_id}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, category_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">无分类</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name_zh}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tags">标签</Label>
                    <Input
                      id="tags"
                      value={editForm.tags}
                      onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="输入标签，用逗号分隔"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="author">作者</Label>
                    <Select
                      value={editForm.author_id}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, author_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择作者" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">系统案例（无作者）</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.user_id} value={user.user_id}>
                            {user.display_name || user.username || '未知用户'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_featured"
                    checked={editForm.is_featured}
                    onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_featured: checked }))}
                  />
                  <Label htmlFor="is_featured">设为精选案例</Label>
                </div>
              </div>

              {/* AI Prompt */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">生成描述</h3>
                <div className="grid gap-2">
                  <Label htmlFor="prompt">AI Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={editForm.prompt}
                    onChange={(e) => setEditForm(prev => ({ ...prev, prompt: e.target.value }))}
                    placeholder="输入用于生成此案例的 AI 提示词"
                    rows={3}
                  />
                </div>
              </div>

              {/* 代码内容 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">代码内容</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="html_content">HTML 代码</Label>
                    <Textarea
                      id="html_content"
                      value={editForm.html_content}
                      onChange={(e) => setEditForm(prev => ({ ...prev, html_content: e.target.value }))}
                      placeholder="输入 HTML 代码"
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="css_content">CSS 样式</Label>
                    <Textarea
                      id="css_content"
                      value={editForm.css_content}
                      onChange={(e) => setEditForm(prev => ({ ...prev, css_content: e.target.value }))}
                      placeholder="输入 CSS 样式代码"
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="javascript_content">JavaScript 脚本</Label>
                    <Textarea
                      id="javascript_content"
                      value={editForm.javascript_content}
                      onChange={(e) => setEditForm(prev => ({ ...prev, javascript_content: e.target.value }))}
                      placeholder="输入 JavaScript 代码"
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSaveEdit}>
                保存修改
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}