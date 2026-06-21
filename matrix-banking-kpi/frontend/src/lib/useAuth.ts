'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getStoredUser, User } from './api';

export function useAuth(required = true) {
  const router = useRouter();
  const user = getStoredUser();
  const token = getToken();

  useEffect(() => {
    if (required && (!token || !user)) {
      router.push('/login');
    }
  }, [required, token, user, router]);

  return { user: user as User | null, token, isAuthenticated: !!token && !!user };
}
