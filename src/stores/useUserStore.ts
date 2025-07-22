import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// 用户档案接口
interface UserProfile {
  id: string;
  user_id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

// 用户统计数据接口
interface UserStats {
  totalCases: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalFavorites: number;
}

// 用户案例接口
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

// Store 状态接口
interface UserState {
  // 认证相关
  user: User | null;
  session: Session | null;
  loading: boolean;
  
  // 用户资料
  profile: UserProfile | null;
  
  // 用户统计
  stats: UserStats;
  
  // 用户案例
  userCases: UserCase[];
  draftCases: UserCase[];
  
  // 收藏案例
  favoriteIds: string[];
  
  // 加载状态
  profileLoading: boolean;
  statsLoading: boolean;
  casesLoading: boolean;
}

// Store 动作接口
interface UserActions {
  // 认证动作
  setAuth: (user: User | null, session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  
  // 用户资料动作
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  fetchProfile: () => Promise<void>;
  
  // 统计数据动作
  setStats: (stats: UserStats) => void;
  fetchStats: () => Promise<void>;
  
  // 案例管理动作
  setUserCases: (cases: UserCase[]) => void;
  addUserCase: (case_: UserCase) => void;
  updateUserCase: (id: string, updates: Partial<UserCase>) => void;
  removeUserCase: (id: string) => void;
  fetchUserCases: () => Promise<void>;
  
  // 收藏管理动作
  setFavoriteIds: (ids: string[]) => void;
  addToFavorites: (caseId: string) => Promise<void>;
  removeFromFavorites: (caseId: string) => Promise<void>;
  fetchFavorites: () => Promise<void>;
  
  // 清理动作
  clearUserData: () => void;
}

type UserStore = UserState & UserActions;

const initialStats: UserStats = {
  totalCases: 0,
  totalViews: 0,
  totalLikes: 0,
  totalComments: 0,
  totalFavorites: 0,
};

// 清理认证状态的辅助函数
const cleanupAuthState = () => {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      session: null,
      loading: true,
      profile: null,
      stats: initialStats,
      userCases: [],
      draftCases: [],
      favoriteIds: [],
      profileLoading: false,
      statsLoading: false,
      casesLoading: false,

      // 认证动作
      setAuth: (user, session) => {
        set({ user, session });
        
        // 如果用户登录，异步获取用户数据
        if (user && session) {
          setTimeout(() => {
            const store = get();
            store.fetchProfile();
            store.fetchStats();
            store.fetchUserCases();
            store.fetchFavorites();
          }, 0);
        }
      },

      setLoading: (loading) => set({ loading }),

      signOut: async () => {
        try {
          // 先清理 store 数据
          set({
            user: null,
            session: null,
            profile: null,
            stats: initialStats,
            userCases: [],
            draftCases: [],
            favoriteIds: [],
            loading: false,
          });
          
          // 清理本地存储的认证数据
          cleanupAuthState();
          
          // 执行 Supabase 登出
          await supabase.auth.signOut({ scope: 'global' });
          
          // 强制页面刷新
          window.location.href = '/auth';
        } catch (error) {
          console.error('登出错误:', error);
        }
      },

      // 用户资料动作
      setProfile: (profile) => set({ profile }),

      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) return;

        try {
          const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) throw error;
          
          set({ profile: data });
        } catch (error) {
          console.error('更新用户资料失败:', error);
          throw error;
        }
      },

      fetchProfile: async () => {
        const { user } = get();
        if (!user) return;

        try {
          set({ profileLoading: true });
          
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // 忽略未找到的错误
            throw error;
          }
          
          set({ profile: data || null });
        } catch (error) {
          console.error('获取用户资料失败:', error);
        } finally {
          set({ profileLoading: false });
        }
      },

      // 统计数据动作
      setStats: (stats) => set({ stats }),

      fetchStats: async () => {
        const { user } = get();
        if (!user) return;

        try {
          set({ statsLoading: true });
          
          // 获取用户案例
          const { data: cases, error: casesError } = await supabase
            .from('cases')
            .select('id, view_count, like_count')
            .eq('author_id', user.id);

          if (casesError) throw casesError;

          // 计算统计数据
          const totalCases = cases?.length || 0;
          const totalViews = cases?.reduce((sum, case_) => sum + (case_.view_count || 0), 0) || 0;
          const totalLikes = cases?.reduce((sum, case_) => sum + (case_.like_count || 0), 0) || 0;

          // 获取评论数量 (只有当有案例时才查询)
          let totalComments = 0;
          if (cases && cases.length > 0) {
            const caseIds = cases.map((c: any) => c.id);
            const { data: comments, error: commentsError } = await supabase
              .from('case_comments')
              .select('id')
              .in('case_id', caseIds);

            if (commentsError && commentsError.code !== 'PGRST116') {
              throw commentsError;
            }
            
            totalComments = comments?.length || 0;
          }

          // 获取收藏数量
          const { data: favorites, error: favoritesError } = await supabase
            .from('user_favorites')
            .select('id')
            .eq('user_id', user.id);

          if (favoritesError && favoritesError.code !== 'PGRST116') {
            throw favoritesError;
          }

          const stats: UserStats = {
            totalCases,
            totalViews,
            totalLikes,
            totalComments,
            totalFavorites: favorites?.length || 0,
          };

          set({ stats });
        } catch (error) {
          console.error('获取用户统计失败:', error);
        } finally {
          set({ statsLoading: false });
        }
      },

      // 案例管理动作
      setUserCases: (cases) => {
        const publishedCases = cases.filter(c => c.status === 'published');
        const draftCases = cases.filter(c => c.status === 'draft');
        set({ 
          userCases: publishedCases,
          draftCases: draftCases
        });
      },

      addUserCase: (case_) => {
        const { userCases, draftCases } = get();
        if (case_.status === 'published') {
          set({ userCases: [...userCases, case_] });
        } else if (case_.status === 'draft') {
          set({ draftCases: [...draftCases, case_] });
        }
      },

      updateUserCase: (id, updates) => {
        const { userCases, draftCases } = get();
        
        const updateCase = (cases: UserCase[]) =>
          cases.map(case_ => case_.id === id ? { ...case_, ...updates } : case_);
        
        set({
          userCases: updateCase(userCases),
          draftCases: updateCase(draftCases)
        });
      },

      removeUserCase: (id) => {
        const { userCases, draftCases } = get();
        set({
          userCases: userCases.filter(c => c.id !== id),
          draftCases: draftCases.filter(c => c.id !== id)
        });
      },

      fetchUserCases: async () => {
        const { user } = get();
        if (!user) return;

        try {
          set({ casesLoading: true });
          
          const { data: cases, error } = await supabase
            .from('cases')
            .select('*')
            .eq('author_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          
          get().setUserCases(cases || []);
        } catch (error) {
          console.error('获取用户案例失败:', error);
        } finally {
          set({ casesLoading: false });
        }
      },

      // 收藏管理动作
      setFavoriteIds: (ids) => set({ favoriteIds: ids }),

      addToFavorites: async (caseId) => {
        const { user, favoriteIds } = get();
        if (!user) throw new Error('用户未登录');
        
        if (favoriteIds.includes(caseId)) return;

        try {
          const { data, error } = await supabase.rpc('toggle_case_favorite', {
            case_id: caseId
          });

          if (error) throw error;

          // 只有当数据库操作成功时才更新本地状态
          set({ favoriteIds: [...favoriteIds, caseId] });
        } catch (error) {
          console.error('添加收藏失败:', error);
          throw error;
        }
      },

      removeFromFavorites: async (caseId) => {
        const { user, favoriteIds } = get();
        if (!user) throw new Error('用户未登录');
        
        if (!favoriteIds.includes(caseId)) return;

        try {
          const { data, error } = await supabase.rpc('toggle_case_favorite', {
            case_id: caseId
          });

          if (error) throw error;

          // 只有当数据库操作成功时才更新本地状态
          set({ favoriteIds: favoriteIds.filter(id => id !== caseId) });
        } catch (error) {
          console.error('取消收藏失败:', error);
          throw error;
        }
      },

      fetchFavorites: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const { data, error } = await supabase
            .from('user_favorites')
            .select('case_id')
            .eq('user_id', user.id);

          if (error && error.code !== 'PGRST116') {
            throw error;
          }
          
          const favoriteIds = data?.map(f => f.case_id) || [];
          set({ favoriteIds });
        } catch (error) {
          console.error('获取收藏列表失败:', error);
        }
      },

      // 清理动作
      clearUserData: () => {
        set({
          user: null,
          session: null,
          profile: null,
          stats: initialStats,
          userCases: [],
          draftCases: [],
          favoriteIds: [],
          loading: false,
        });
      },
    }),
    {
      name: 'inspire-ai-user-storage',
      storage: createJSONStorage(() => localStorage),
      // 只持久化需要的数据，认证状态由 Supabase 管理
      partialize: (state) => ({
        profile: state.profile,
        stats: state.stats,
        userCases: state.userCases,
        draftCases: state.draftCases,
        favoriteIds: state.favoriteIds,
      }),
    }
  )
);