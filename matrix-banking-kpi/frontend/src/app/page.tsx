'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getStoredUser, getDashboardPath } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();
    if (token && user) {
      router.push(getDashboardPath(user.role));
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );
}
