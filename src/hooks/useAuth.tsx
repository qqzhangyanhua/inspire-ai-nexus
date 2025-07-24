"use client"

import { useUserStore } from '@/stores/useUserStore';

export const useAuth = () => {
  const { user, session, loading, signOut } = useUserStore();

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!user,
  };
};