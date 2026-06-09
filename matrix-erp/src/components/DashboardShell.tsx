"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { APP_NAME, ROLE_LABELS, SCHOOL_HOME_PATH } from "@/lib/constants";
import type { SessionUser } from "@/lib/session";
import { NotificationBell } from "./NotificationBell";
import { SystemFooter } from "./SystemFooter";

type NavItem = { href: string; label: string };

export function DashboardShell({
  user,
  nav,
  children,
}: {
  user: SessionUser;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b border-[#1f2a44] bg-[#0d1528] p-4 md:hidden">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">{APP_NAME}</p>
          <p className="font-bold">{ROLE_LABELS[user.role]}</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          Menu
        </button>
      </header>

      <div className="flex flex-1 flex-col md:grid md:grid-cols-[260px_1fr]">
        <aside
          className={`border-r border-[#1f2a44] bg-[#0d1528] p-4 ${
            menuOpen ? "block" : "hidden"
          } md:block`}
        >
          <div className="mb-6 hidden md:block">
            <p className="text-xs uppercase tracking-widest text-slate-400">{APP_NAME}</p>
            <h1 className="text-lg font-bold">{ROLE_LABELS[user.role]}</h1>
            {user.schoolName && (
              <p className="text-sm text-slate-400">
                {user.schoolName} ({user.schoolCode})
              </p>
            )}
          </div>
          <div className="mb-4">
            <NotificationBell />
          </div>
          <nav className="space-y-1">
            {user.schoolCode && (
              <Link
                href={SCHOOL_HOME_PATH}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-lg px-3 py-2 hover:bg-[#1a2744] ${
                  pathname === SCHOOL_HOME_PATH ? "bg-[#1a2744] font-semibold" : ""
                }`}
              >
                School Homepage
              </Link>
            )}
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-lg px-3 py-2 hover:bg-[#1a2744] ${
                  pathname === item.href ? "bg-[#1a2744] font-semibold" : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action="/api/auth/logout" method="post" className="mt-8">
            <button type="submit" className="btn btn-secondary w-full">
              Logout
            </button>
          </form>
        </aside>
        <main className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex-1">{children}</div>
          <SystemFooter />
        </main>
      </div>
    </div>
  );
}
