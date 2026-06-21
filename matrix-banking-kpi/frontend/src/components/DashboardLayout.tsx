'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAuth, getStoredUser, ROLE_LABELS } from '@/lib/api';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { href: '/dashboard/super-admin', label: 'Banks', icon: '🏦' },
    { href: '/dashboard/super-admin/users', label: 'Bank Users', icon: '👥' },
  ],
  DIRECTOR_DEPOSIT_MOBILIZATION: [
    { href: '/dashboard/director', label: 'Overview', icon: '📊' },
    { href: '/dashboard/reports', label: 'Reports', icon: '📋' },
    { href: '/dashboard/organization', label: 'Organization', icon: '🏢' },
  ],
  DISTRICT_MANAGER: [
    { href: '/dashboard/district', label: 'District KPI', icon: '📊' },
    { href: '/dashboard/users', label: 'Staff Management', icon: '👥' },
    { href: '/dashboard/organization', label: 'Branches', icon: '🏢' },
    { href: '/dashboard/reports', label: 'Reports', icon: '📋' },
  ],
  BRANCH_MANAGER: [
    { href: '/dashboard/branch', label: 'Branch KPI', icon: '📊' },
    { href: '/dashboard/targets', label: 'Set Targets', icon: '🎯' },
    { href: '/dashboard/assignments', label: 'Assignments', icon: '📌' },
    { href: '/dashboard/approvals', label: 'Approvals', icon: '✅' },
    { href: '/dashboard/users', label: 'Staff', icon: '👥' },
    { href: '/dashboard/reports', label: 'Reports', icon: '📋' },
  ],
  STAFF: [
    { href: '/dashboard/staff', label: 'My KPI', icon: '📊' },
    { href: '/dashboard/entries', label: 'Daily Entry', icon: '📝' },
    { href: '/dashboard/reports', label: 'Reports', icon: '📋' },
  ],
};

function getNavItems(role: string): NavItem[] {
  if (['CUSTOMER_SERVICE_MANAGER', 'CUSTOMER_SERVICE_OFFICER', 'CASHIER', 'CONTROLLER', 'CREDIT_RELATIONSHIP_MANAGER'].includes(role)) {
    return NAV_BY_ROLE.STAFF;
  }
  return NAV_BY_ROLE[role] || [];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser();
  const navItems = user ? getNavItems(user.role) : [];

  function handleLogout() {
    clearAuth();
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r border-amber-200 flex flex-col shadow-sm">
        <div className="p-5 border-b border-amber-100">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">M</div>
            <div>
              <h2 className="font-bold text-sm text-stone-900 leading-tight">Matrix Banking</h2>
              <p className="text-xs text-amber-600">KPI Tracker</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${pathname === item.href ? 'sidebar-link-active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-amber-100">
          {user && (
            <div className="mb-3 px-2">
              <p className="font-semibold text-sm text-stone-800 truncate">{user.fullName}</p>
              <p className="text-xs text-stone-500">{ROLE_LABELS[user.role]}</p>
              {user.bankName && <p className="text-xs text-amber-600 truncate">{user.bankName}</p>}
            </div>
          )}
          <button onClick={handleLogout} className="w-full btn-secondary text-sm py-2">
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">Matrix Modern Banking KPI Tracker</h1>
              <p className="text-amber-100 text-sm">Developed by Yeabsra Teffera – Professional Banker</p>
            </div>
            <div className="flex items-center gap-2 text-amber-100 text-xs">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live Updates
            </div>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
