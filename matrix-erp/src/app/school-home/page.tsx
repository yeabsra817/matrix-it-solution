import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPublicSchoolHomepage } from "@/lib/school-homepage";
import { SchoolHomepageView, roleQuickLinks } from "@/components/SchoolHomepageView";
import { ROLE_HOME, ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { SchoolHomepageFooter } from "@/components/SchoolHomepageFooter";

const EXTRA_LINKS: Partial<Record<Role, { href: string; label: string }[]>> = {
  HR: [
    { href: "/dashboard/hr/staff", label: "All Staff" },
    { href: "/dashboard/hr/leave", label: "Leave Approvals" },
  ],
  TEACHER: [
    { href: "/dashboard/teacher/marks", label: "Marks" },
    { href: "/dashboard/teacher/attendance", label: "Attendance" },
  ],
  STUDENT: [
    { href: "/dashboard/student/marks", label: "My Marks" },
    { href: "/dashboard/student/homework", label: "Homework" },
  ],
  PARENT: [
    { href: "/dashboard/parent/marks", label: "Child Progress" },
    { href: "/dashboard/parent/messages", label: "Messages" },
  ],
  SCHOOL_ADMIN: [
    { href: "/dashboard/school-admin/users", label: "All Users" },
    { href: "/dashboard/school-admin/homepage", label: "Customize Homepage" },
  ],
  SCHOOL_ASSISTANT: [
    { href: "/dashboard/school-assistant/students", label: "Students & Parents" },
  ],
  DIRECTOR: [
    { href: "/dashboard/director/reports", label: "Reports" },
    { href: "/dashboard/director/pms", label: "PMS" },
  ],
};

export default async function SchoolHomePage() {
  const session = await getSession();
  if (!session?.schoolCode) redirect("/login");

  const data = await getPublicSchoolHomepage(session.schoolCode);
  if (!data) redirect("/login");

  const base = roleQuickLinks(session.role as Role);
  const extra = EXTRA_LINKS[session.role as Role] || [];
  const quickLinks = [...base, ...extra];

  return (
    <div>
      <div className="border-b border-[#1f2a44] bg-[#0d1528] px-4 py-3 flex flex-wrap justify-between items-center gap-2">
        <p className="text-sm text-slate-400">
          Signed in as <strong className="text-slate-200">{session.fullName}</strong> ·{" "}
          {ROLE_LABELS[session.role as Role]}
        </p>
        <Link href={ROLE_HOME[session.role as Role]} className="btn btn-primary text-sm">
          Open Dashboard
        </Link>
      </div>
      <SchoolHomepageView data={data} showLogin={false} quickLinks={quickLinks} />
      <SchoolHomepageFooter />
    </div>
  );
}
