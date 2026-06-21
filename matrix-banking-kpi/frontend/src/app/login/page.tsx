'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken, setStoredUser, getDashboardPath, User } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await api<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!result.success || !result.data) {
      setError(result.message || 'Something went wrong, please try again');
      return;
    }

    setToken(result.data.token);
    setStoredUser(result.data.user);
    router.push(getDashboardPath(result.data.user.role));
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg">
            M
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Matrix Modern Banking</h1>
          <h2 className="text-lg text-amber-600 font-semibold">KPI Tracker</h2>
          <p className="text-sm text-stone-500 mt-2">Developed by Yeabsra Teffera – Professional Banker</p>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold text-stone-800 mb-6">Sign In</h3>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@bank.com"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs font-semibold text-amber-800 mb-2">Development logins</p>
              <div className="text-xs text-stone-600 space-y-1">
                <p>Super Admin: yeabsra45@gmail.com</p>
                <p>Branch Manager: branch@matrixbank.com (Password123!)</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
