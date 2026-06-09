import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { PasswordChangeForm } from "@/components/PasswordChangeForm";
import { getSession } from "@/lib/session";
import type { Role } from "./constants";
import { getRoleNav } from "./role-nav";

export function makeRoleLayout(role: Role, nav?: { href: string; label: string }[]) {
  const items = nav ?? getRoleNav(role);
  return async function RoleLayout({ children }: { children: React.ReactNode }) {
    const session = await getSession();
    if (!session || session.role !== role) redirect("/login");
    return (
      <DashboardShell user={session} nav={items}>
        {children}
      </DashboardShell>
    );
  };
}

export function SettingsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Settings</h2>
      <PasswordChangeForm />
    </div>
  );
}
