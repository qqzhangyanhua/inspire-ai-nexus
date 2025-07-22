import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Eye, Heart, MessageSquare, Plus, Edit, Trash2, Calendar, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface UserStats {
  totalCases: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
}

interface UserCase {
  id: string;
  title: string;
  description: string;
  image_url: string;
  view_count: number;
  like_count: number;
  status: string;
  created_at: string;
  tags: string[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<UserStats>({
    totalCases: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0
  });
  const [userCases, setUserCases] = useState<UserCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // 获取用户案例
      const { data: cases, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .eq('author_id', user?.id)
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;

      setUserCases(cases || []);

      // 计算统计数据
      const totalViews = cases?.reduce((sum, case_) => sum + (case_.view_count || 0), 0) || 0;
      const totalLikes = cases?.reduce((sum, case_) => sum + (case_.like_count || 0), 0) || 0;

      // 获取评论数量
      const { data: comments, error: commentsError } = await supabase
        .from('case_comments')
        .select('id')
        .in('case_id', cases?.map(c => c.id) || []);

      if (commentsError) throw commentsError;

      setStats({
        totalCases: cases?.length || 0,
        totalViews,
        totalLikes,
        totalComments: comments?.length || 0
      });
    } catch (error) {
      console.error('获取工作台数据失败:', error);
      toast({
        title: "加载失败",
        description: "无法获取工作台数据，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    try {
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseId);

      if (error) throw error;

      setUserCases(userCases.filter(c => c.id !== caseId));
      toast({
        title: "删除成功",
        description: "案例已成功删除",
      });
    } catch (error) {
      console.error('删除案例失败:', error);
      toast({
        title: "删除失败",
        description: "无法删除案例，请稍后再试",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      published: { label: "已发布", variant: "default" as const },
      draft: { label: "草稿", variant: "secondary" as const },
      pending: { label: "待审核", variant: "outline" as const }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.published;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-foreground">我的工作台</h1>
              <p className="text-muted-foreground">管理您的创意案例和数据</p>
            </div>
          </div>
          <Button onClick={() => navigate('/contribute')} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            创建新案例
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总案例数</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCases}</div>
              <p className="text-xs text-muted-foreground">您创建的案例总数</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总浏览量</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews}</div>
              <p className="text-xs text-muted-foreground">所有案例的浏览次数</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总点赞数</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLikes}</div>
              <p className="text-xs text-muted-foreground">获得的点赞总数</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总评论数</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalComments}</div>
              <p className="text-xs text-muted-foreground">收到的评论总数</p>
            </CardContent>
          </Card>
        </div>

        {/* 主要内容区域 */}
        <Tabs defaultValue="cases" className="space-y-6">
          <TabsList>
            <TabsTrigger value="cases">我的案例</TabsTrigger>
            <TabsTrigger value="drafts">草稿箱</TabsTrigger>
            <TabsTrigger value="analytics">数据分析</TabsTrigger>
          </TabsList>

          <TabsContent value="cases" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>已发布的案例</CardTitle>
                <CardDescription>管理您已发布的创意案例</CardDescription>
              </CardHeader>
              <CardContent>
                {userCases.filter(c => c.status === 'published').length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">您还没有发布任何案例</p>
                    <Button onClick={() => navigate('/contribute')}>
                      创建第一个案例
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userCases
                      .filter(c => c.status === 'published')
                      .map((case_) => (
                        <Card key={case_.id} className="group">
                          <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                            <img 
                              src={case_.image_url} 
                              alt={case_.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-sm line-clamp-2">{case_.title}</h3>
                              {getStatusBadge(case_.status)}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                              {case_.description}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                              <div className="flex items-center space-x-3">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {case_.view_count || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  {case_.like_count || 0}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(case_.created_at).toLocaleDateString('zh-CN')}
                              </div>
                            </div>

                            {case_.tags && case_.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {case_.tags.slice(0, 3).map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => navigate(`/case/${case_.id}`)}
                              >
                                查看
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/edit/${case_.id}`)}
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
                                      您确定要删除这个案例吗？此操作无法撤销。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteCase(case_.id)}>
                                      删除
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drafts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>草稿箱</CardTitle>
                <CardDescription>管理您的草稿和待发布的案例</CardDescription>
              </CardHeader>
              <CardContent>
                {userCases.filter(c => c.status === 'draft').length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">暂无草稿</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userCases
                      .filter(c => c.status === 'draft')
                      .map((case_) => (
                        <div key={case_.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <img 
                            src={case_.image_url} 
                            alt={case_.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold">{case_.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {case_.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusBadge(case_.status)}
                              <span className="text-xs text-muted-foreground">
                                {new Date(case_.created_at).toLocaleDateString('zh-CN')}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => navigate(`/edit/${case_.id}`)}>
                              继续编辑
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>确认删除</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    您确定要删除这个草稿吗？此操作无法撤销。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteCase(case_.id)}>
                                    删除
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>性能概览</CardTitle>
                  <CardDescription>您的案例表现统计</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">平均浏览量</span>
                      <span className="font-semibold">
                        {stats.totalCases > 0 ? Math.round(stats.totalViews / stats.totalCases) : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">平均点赞数</span>
                      <span className="font-semibold">
                        {stats.totalCases > 0 ? Math.round(stats.totalLikes / stats.totalCases) : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">参与度</span>
                      <span className="font-semibold">
                        {stats.totalViews > 0 ? ((stats.totalLikes / stats.totalViews) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>最受欢迎的案例</CardTitle>
                  <CardDescription>按浏览量排序的热门案例</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userCases
                      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
                      .slice(0, 5)
                      .map((case_, index) => (
                        <div key={case_.id} className="flex items-center space-x-3">
                          <span className="text-sm font-semibold text-muted-foreground w-4">
                            {index + 1}
                          </span>
                          <img 
                            src={case_.image_url} 
                            alt={case_.title}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{case_.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {case_.view_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {case_.like_count || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;