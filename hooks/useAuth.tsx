import { useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/stores/useUserStore';

export const useAuth = () => {
  const { user, session, loading, setAuth, setLoading, signOut } = useUserStore();
  
  return {
    user,
    session,
    loading,
    signOut,
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setAuth, setLoading, clearUserData } = useUserStore();

  useEffect(() => {
    // 设置认证状态监听器
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        // 更新认证状态
        setAuth(session?.user ?? null, session);
        setLoading(false);
        
        // 处理登出事件
        if (event === 'SIGNED_OUT') {
          clearUserData();
        }
      }
    );

    // 检查现有会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setAuth(session?.user ?? null, session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setAuth, setLoading, clearUserData]);

  return <>{children}</>;
};