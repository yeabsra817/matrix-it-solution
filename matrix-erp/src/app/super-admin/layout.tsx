import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/super-admin", label: "Overview" },
  { href: "/super-admin/schools", label: "Schools" },
  { href: "/super-admin/school-users", label: "School Admins" },
  { href: "/super-admin/homepage-template", label: "Homepage Template" },
  { href: "/super-admin/role-requests", label: "Role Requests" },
  { href: "/super-admin/blocks", label: "Global Blocks" },
  { href: "/super-admin/security", label: "Security Dashboard" },
  { href: "/super-admin/backups", label: "Backups" },
  { href: "/super-admin/audit", label: "Audit Logs" },
  { href: "/super-admin/settings", label: "Settings" },
];

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") redirect("/login");
  return (
    <DashboardShell user={session} nav={nav}>
      {children}
    </DashboardShell>
  );
}
