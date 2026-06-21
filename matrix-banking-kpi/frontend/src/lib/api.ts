/**
 * API base URL for Matrix Banking KPI Tracker
 *
 * Production (Vercel): leave NEXT_PUBLIC_API_URL unset — requests use same-origin
 * `/api/*` and Next.js rewrites proxy to the Express backend (API_URL).
 *
 * Development: set NEXT_PUBLIC_API_URL=http://localhost:4000 OR rely on rewrites
 * with API_URL=http://localhost:4000 in .env.local
 */
export function getApiBaseUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (publicUrl) return publicUrl;

  // Browser: same-origin proxy via Vercel/Next rewrites
  if (typeof window !== 'undefined') return '';

  // SSR fallback (direct backend)
  return (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  bankId?: string | null;
  districtId?: string | null;
  branchId?: string | null;
  bankName?: string | null;
  branchName?: string | null;
  districtName?: string | null;
  mustChangePassword?: boolean;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user: User) {
  localStorage.setItem('user', JSON.stringify(user));
}

export async function api<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const base = getApiBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${path}`;

  try {
    const res = await fetch(url, { ...options, headers, credentials: 'include' });
    const json = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: json.message || 'Something went wrong, please try again',
        error: json.error,
      };
    }
    return json;
  } catch {
    return {
      success: false,
      message: 'Something went wrong, please try again',
    };
  }
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  DIRECTOR_DEPOSIT_MOBILIZATION: 'Director Deposit Mobilization',
  DISTRICT_MANAGER: 'District Manager',
  BRANCH_MANAGER: 'Branch Manager',
  CUSTOMER_SERVICE_MANAGER: 'Customer Service Manager',
  CUSTOMER_SERVICE_OFFICER: 'Customer Service Officer',
  CASHIER: 'Cashier',
  CONTROLLER: 'Controller',
  CREDIT_RELATIONSHIP_MANAGER: 'Credit Relationship Manager',
};

export const KPI_LABELS: Record<string, string> = {
  DEPOSIT_MOBILIZATION: 'Deposit Mobilization',
  NEW_ACCOUNTS: 'New Accounts',
  MOBILE_BANKING: 'Mobile Banking',
  CARD_BANKING: 'Card Banking',
  QR_BANKING: 'QR Banking',
};

export function formatNumber(n: number, isCurrency = false): string {
  if (isCurrency) {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      maximumFractionDigits: 0,
    }).format(n);
  }
  return new Intl.NumberFormat('en-ET').format(n);
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function getDashboardPath(role: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: '/dashboard/super-admin',
    DIRECTOR_DEPOSIT_MOBILIZATION: '/dashboard/director',
    DISTRICT_MANAGER: '/dashboard/district',
    BRANCH_MANAGER: '/dashboard/branch',
    CUSTOMER_SERVICE_MANAGER: '/dashboard/staff',
    CUSTOMER_SERVICE_OFFICER: '/dashboard/staff',
    CASHIER: '/dashboard/staff',
    CONTROLLER: '/dashboard/staff',
    CREDIT_RELATIONSHIP_MANAGER: '/dashboard/staff',
  };
  return map[role] || '/dashboard';
}
