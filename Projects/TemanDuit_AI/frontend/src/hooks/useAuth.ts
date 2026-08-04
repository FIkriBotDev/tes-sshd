'use client';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, setUser, logout } = useAuthStore();
  const router = useRouter();

  const refreshProfile = async () => {
    try {
      const res = await authApi.getProfile();
      if (res.data) setUser(res.data);
    } catch {
      logout();
      router.push('/login');
    }
  };

  return { user, token, isAuthenticated, setAuth, setUser, logout, refreshProfile };
}

export function useRequireAuth() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  return useAuthStore();
}
