import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getSchoolDb } from "@/lib/school-db";
import { hasPermission } from "@/lib/rbac";
import { STAFF_ROLES } from "@/lib/staff-roles";

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!hasPermission(session!, "exportStaff")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getSchoolDb(session!.schoolCode!);
  const users = await db.user.findMany({
    where: { role: { in: STAFF_ROLES } },
    select: {
      fullName: true,
      email: true,
      role: true,
      blockedAt: true,
      mustChangePwd: true,
      createdAt: true,
    },
    orderBy: { fullName: "asc" },
  });

  const header = "Name,Email,Role,Status,MustChangePassword,CreatedAt";
  const rows = users.map((u) => {
    const status = u.blockedAt ? "Blocked" : u.mustChangePwd ? "PwdChange" : "Active";
    return [
      `"${u.fullName.replace(/"/g, '""')}"`,
      u.email,
      u.role,
      status,
      u.mustChangePwd ? "yes" : "no",
      u.createdAt.toISOString(),
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="staff-${session!.schoolCode}.csv"`,
    },
  });
}
