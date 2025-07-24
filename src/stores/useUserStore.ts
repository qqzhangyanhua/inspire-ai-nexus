import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { usersAPI, casesAPI, favoritesAPI } from '@/lib/api';

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
  favoriteCases: UserCase[];
  
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
  setFavoriteCases: (cases: UserCase[]) => void;
  addToFavorites: (caseId: string) => Promise<void>;
  removeFromFavorites: (caseId: string) => Promise<void>;
  fetchFavorites: () => Promise<void>;
  fetchFavoriteCases: () => Promise<void>;
  
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
      favoriteCases: [],
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
            // 获取收藏列表后再获取详情
            setTimeout(() => {
              store.fetchFavoriteCases();
            }, 100);
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
          favoriteCases: [],
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
          const response = await usersAPI.updateProfile(user.id, updates);
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          set({ profile: response.profile });
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
          
          const response = await usersAPI.getProfile(user.id);
          
          if (response.error) {
            console.error('获取用户资料失败:', response.error);
            return;
          }
          
          set({ profile: response.profile });
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
          
          const response = await usersAPI.getStats(user.id);
          
          if (response.error) {
            console.error('获取统计数据失败:', response.error);
            return;
          }
          
          set({ stats: response.stats });
        } catch (error) {
          console.error('获取统计数据失败:', error);
        } finally {
          set({ statsLoading: false });
        }
      },

      // 案例管理动作
      setUserCases: (cases) => set({ userCases: cases }),

      setDraftCases: (cases: UserCase[]) => set({ draftCases: cases }),

      addUserCase: (newCase) => {
        const { userCases } = get();
        set({ userCases: [newCase, ...userCases] });
      },

      updateUserCase: (id: string, updates: Partial<UserCase>) => {
        const { userCases, draftCases } = get();
        set({
          userCases: userCases.map(c => c.id === id ? { ...c, ...updates } : c),
          draftCases: draftCases.map(c => c.id === id ? { ...c, ...updates } : c),
        });
      },

      removeUserCase: (caseId) => {
        const { userCases, draftCases } = get();
        set({
          userCases: userCases.filter(c => c.id !== caseId),
          draftCases: draftCases.filter(c => c.id !== caseId),
        });
      },

      fetchUserCases: async () => {
        const { user } = get();
        if (!user) return;

        try {
          set({ casesLoading: true });
          
          const response = await casesAPI.getCases({ authorId: user.id });
          
          if (response.error) {
            console.error('获取用户案例失败:', response.error);
            return;
          }
          
          const cases = response.cases || [];
          const publishedCases = cases.filter((c: any) => c.status === 'published');
          const draftCases = cases.filter((c: any) => c.status === 'draft');
          
          set({ 
            userCases: publishedCases,
            draftCases: draftCases,
          });
        } catch (error) {
          console.error('获取用户案例失败:', error);
        } finally {
          set({ casesLoading: false });
        }
      },

      // 收藏管理动作
      setFavoriteIds: (ids) => set({ favoriteIds: ids }),

      setFavoriteCases: (cases) => set({ favoriteCases: cases }),

      addToFavorites: async (caseId) => {
        const { user, favoriteIds } = get();
        if (!user) throw new Error('用户未登录');
        
        if (favoriteIds.includes(caseId)) return;

        try {
          const response = await favoritesAPI.toggleFavorite(caseId);

          if (response.error) {
            throw new Error(response.error);
          }

          // 只有当API操作成功时才更新本地状态
          set({ favoriteIds: [...favoriteIds, caseId] });
        } catch (error) {
          console.error('添加收藏失败:', error);
          throw error;
        }
      },

      removeFromFavorites: async (caseId) => {
        const { user, favoriteIds, favoriteCases } = get();
        if (!user) throw new Error('用户未登录');
        
        if (!favoriteIds.includes(caseId)) return;

        try {
          const response = await favoritesAPI.toggleFavorite(caseId);

          if (response.error) {
            throw new Error(response.error);
          }

          // 更新本地状态
          set({ 
            favoriteIds: favoriteIds.filter(id => id !== caseId),
            favoriteCases: favoriteCases.filter(c => c.id !== caseId),
          });
        } catch (error) {
          console.error('移除收藏失败:', error);
          throw error;
        }
      },

      fetchFavorites: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const response = await favoritesAPI.getFavorites(user.id);
          
          if (response.error) {
            console.error('获取收藏列表失败:', response.error);
            return;
          }
          
          set({ favoriteIds: response.favoriteIds || [] });
        } catch (error) {
          console.error('获取收藏列表失败:', error);
        }
      },

      fetchFavoriteCases: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const response = await favoritesAPI.getFavorites(user.id, true);
          
          if (response.error) {
            console.error('获取收藏案例失败:', response.error);
            return;
          }
          
          set({ favoriteCases: response.favoriteCases || [] });
        } catch (error) {
          console.error('获取收藏案例失败:', error);
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
          favoriteCases: [],
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
        favoriteCases: state.favoriteCases,
      }),
    }
  )
);