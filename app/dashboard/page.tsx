'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/useUserStore';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Eye, Heart, MessageSquare, Plus, Edit, Trash2, Calendar, TrendingUp, BarChart3, PieChart, Users, Clock, FileText, Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function DashboardPage() {
  const { user } = useAuth();
  const { 
    profile, 
    stats, 
    userCases, 
    draftCases, 
    favoriteCases,
    profileLoading, 
    statsLoading, 
    casesLoading,
    removeUserCase,
    removeFromFavorites,
    fetchStats 
  } = useUserStore();
  const { toast } = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  const handleDeleteCase = async (caseId: string) => {
    try {
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseId);

      if (error) throw error;

      // 从 store 中移除案例
      removeUserCase(caseId);
      
      // 重新获取统计数据
      fetchStats();
      
      toast({
        title: '删除成功',
        description: '案例已成功删除',
      });
    } catch (error) {
      console.error('删除案例失败:', error);
      toast({
        title: '删除失败',
        description: '无法删除案例，请稍后再试',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      published: { label: '已发布', variant: 'default' as const },
      draft: { label: '草稿', variant: 'secondary' as const },
      pending: { label: '待审核', variant: 'outline' as const }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.published;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (!user) return null;

  const loading = profileLoading || statsLoading || casesLoading;
  const allUserCases = [...userCases, ...draftCases];
  
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
              <AvatarImage src={profile?.avatar_url || '/placeholder-avatar.jpg'} />
              <AvatarFallback>
                {profile?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {profile?.display_name || '我的工作台'}
              </h1>
              <p className="text-muted-foreground">管理您的创意案例和数据</p>
            </div>
          </div>
          <Button onClick={() => router.push('/case/create')} className="flex items-center gap-2">
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
            <TabsTrigger value="favorites">我点赞的</TabsTrigger>
            <TabsTrigger value="analytics">数据分析</TabsTrigger>
          </TabsList>

          <TabsContent value="cases" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>已发布的案例</CardTitle>
                <CardDescription>管理您已发布的创意案例</CardDescription>
              </CardHeader>
              <CardContent>
                {userCases.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">您还没有发布任何案例</p>
                    <Button onClick={() => router.push('/case/create')}>
                      创建第一个案例
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userCases.map((case_) => (
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
                              onClick={() => router.push(`/case/${case_.id}`)}
                            >
                              查看
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => router.push(`/case/${case_.id}/edit`)}
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
                <CardDescription>管理您的草稿案例</CardDescription>
              </CardHeader>
              <CardContent>
                {draftCases.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">暂无草稿案例</p>
                    <Button onClick={() => router.push('/case/create')}>
                      创建新案例
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {draftCases.map((case_) => (
                      <Card key={case_.id} className="group">
                        <div className="aspect-video bg-muted rounded-t-lg overflow-hidden relative">
                          <img 
                            src={case_.image_url} 
                            alt={case_.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              草稿
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-sm line-clamp-2">{case_.title}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {case_.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
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
                              onClick={() => router.push(`/case/${case_.id}/edit`)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              继续编辑
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>我点赞的案例</CardTitle>
                <CardDescription>您收藏的优秀创意案例</CardDescription>
              </CardHeader>
              <CardContent>
                {favoriteCases.length === 0 ? (
                  <div className="text-center py-12">
                    <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">暂无收藏案例</p>
                    <Button onClick={() => router.push('/')}>
                      去发现优秀案例
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteCases.map((case_) => (
                      <Card key={case_.id} className="group">
                        <div className="aspect-video bg-muted rounded-t-lg overflow-hidden relative">
                          <img 
                            src={case_.image_url} 
                            alt={case_.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-2 right-2">
                            <Badge variant="default" className="bg-red-100 text-red-800">
                              <Heart className="h-3 w-3 mr-1" />
                              已收藏
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-sm line-clamp-2">{case_.title}</h3>
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
                              onClick={() => router.push(`/case/${case_.id}`)}
                            >
                              查看详情
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await removeFromFavorites(case_.id);
                                  toast({
                                    title: '取消收藏成功',
                                    description: '已从收藏列表中移除',
                                  });
                                } catch (error) {
                                  toast({
                                    title: '取消收藏失败',
                                    description: '请稍后再试',
                                    variant: 'destructive',
                                  });
                                }
                              }}
                            >
                              <Heart className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 数据概览 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    数据概览
                  </CardTitle>
                  <CardDescription>您的创作数据统计</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalCases}</div>
                      <div className="text-sm text-blue-600">总案例数</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.totalViews}</div>
                      <div className="text-sm text-green-600">总浏览量</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{stats.totalLikes}</div>
                      <div className="text-sm text-red-600">总点赞数</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{stats.totalComments}</div>
                      <div className="text-sm text-purple-600">总评论数</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 案例表现 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    案例表现
                  </CardTitle>
                  <CardDescription>各案例的数据表现</CardDescription>
                </CardHeader>
                <CardContent>
                  {userCases.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">暂无案例数据</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userCases.slice(0, 5).map((case_) => (
                        <div key={case_.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{case_.title}</h4>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
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
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => router.push(`/case/${case_.id}`)}
                          >
                            查看
                          </Button>
                        </div>
                      ))}
                      {userCases.length > 5 && (
                        <div className="text-center pt-2">
                          <Button variant="ghost" size="sm">
                            查看更多案例
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 互动数据 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    互动数据
                  </CardTitle>
                  <CardDescription>用户互动情况分析</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">平均浏览量</span>
                      <span className="text-sm text-muted-foreground">
                        {stats.totalCases > 0 ? Math.round(stats.totalViews / stats.totalCases) : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">平均点赞数</span>
                      <span className="text-sm text-muted-foreground">
                        {stats.totalCases > 0 ? Math.round(stats.totalLikes / stats.totalCases) : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">平均评论数</span>
                      <span className="text-sm text-muted-foreground">
                        {stats.totalCases > 0 ? Math.round(stats.totalComments / stats.totalCases) : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">点赞率</span>
                      <span className="text-sm text-muted-foreground">
                        {stats.totalViews > 0 ? ((stats.totalLikes / stats.totalViews) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 创作活跃度 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    创作活跃度
                  </CardTitle>
                  <CardDescription>您的创作时间分布</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">已发布案例</span>
                      <span className="text-sm text-muted-foreground">{userCases.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">草稿案例</span>
                      <span className="text-sm text-muted-foreground">{draftCases.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">收藏案例</span>
                      <span className="text-sm text-muted-foreground">{stats.totalFavorites}</span>
                    </div>
                    {userCases.length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="text-sm font-medium mb-2">最近发布</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(userCases[0].created_at).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}