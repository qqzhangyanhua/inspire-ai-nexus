'use client';

import Header from '@/components/Header';
import FilterPills from '@/components/FilterPills';
import InspirationGrid from '@/components/InspirationGrid';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/stores/useUserStore';
import { useToast } from '@/hooks/use-toast';

// OAuth回调处理组件
function OAuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, fetchProfile } = useUserStore();
  const { toast } = useToast();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // 检查URL中的错误参数
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      if (error) {
        console.error('OAuth错误:', error, errorDescription);
        let errorMessage = 'Google登录失败';
        
        if (error === 'server_error') {
          errorMessage = 'Google登录服务器错误，请稍后重试';
        } else if (errorDescription) {
          errorMessage = decodeURIComponent(errorDescription);
        }
        
        toast({
          title: '登录失败',
          description: errorMessage,
          variant: 'destructive',
        });
        
        // 清理URL参数
        router.replace('/', undefined);
        return;
      }
      
      // 检查是否有认证会话
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('获取会话失败:', sessionError);
          return;
        }
        
        if (session?.user) {
          console.log('OAuth登录成功:', session.user.email);
          
          // 更新认证状态
          setAuth(session.user, session);
          
          // 获取用户资料
          await fetchProfile();
          
          toast({
            title: '登录成功',
            description: `欢迎回来，${session.user.email}！`,
          });
          
          // 清理URL参数
          router.replace('/', undefined);
        }
      } catch (error) {
        console.error('处理OAuth回调失败:', error);
      }
    };
    
    // 只在有相关URL参数时处理回调
    if (searchParams.get('error') || searchParams.get('access_token') || searchParams.get('refresh_token')) {
      handleOAuthCallback();
    }
  }, [searchParams, router, setAuth, fetchProfile, toast]);

  return null;
}

export default function HomePage() {
  const [selectedFilter, setSelectedFilter] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <OAuthCallbackHandler />
      </Suspense>
      
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className="container mx-auto px-4 py-8">
        <FilterPills 
          selectedFilter={selectedFilter} 
          onFilterChange={setSelectedFilter}
        />
        
        <InspirationGrid 
          selectedFilter={selectedFilter}
          searchQuery={searchQuery}
        />
      </main>
    </div>
  );
}