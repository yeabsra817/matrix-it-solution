import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { masterDb } from "@/lib/master-db";
import fs from "fs";
import path from "path";

export async function GET() {
  const { response } = await requirePermission("createSchool");
  if (response) return response;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    schools,
    schoolsActive,
    failedLogins24h,
    successLogins24h,
    globalBlocks,
    pendingRoles,
    roleChanges,
    suspicious,
    backups,
  ] = await Promise.all([
    masterDb.school.count(),
    masterDb.school.count({ where: { isActive: true } }),
    masterDb.loginLog.count({ where: { success: false, createdAt: { gte: since } } }),
    masterDb.loginLog.count({ where: { success: true, createdAt: { gte: since } } }),
    masterDb.globalUserBlock.count(),
    masterDb.roleRequest.count({ where: { status: "PENDING" } }),
    masterDb.auditLog.findMany({
      where: {
        action: { contains: "ROLE" },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        actorEmail: true,
        action: true,
        schoolCode: true,
        details: true,
        createdAt: true,
      },
    }),
    masterDb.loginLog.findMany({
      where: { success: false, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        email: true,
        schoolCode: true,
        ipAddress: true,
        createdAt: true,
      },
    }),
    masterDb.backupLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  let totalSchoolDbs = 0;
  const schoolsDir = path.join(process.cwd(), "data", "schools");
  if (fs.existsSync(schoolsDir)) {
    totalSchoolDbs = fs.readdirSync(schoolsDir).filter((f) => f.endsWith(".db")).length;
  }

  return NextResponse.json({
    aggregatedOnly: true,
    systemHealth: {
      schools,
      schoolsActive,
      totalSchoolDatabases: totalSchoolDbs,
      pendingRoleRequests: pendingRoles,
      globalBlocks,
      lastBackups: backups,
    },
    security: {
      failedLogins24h,
      successLogins24h,
      failedLoginAlerts: suspicious,
      roleChangeLogs: roleChanges,
      blockedUsers: await masterDb.globalUserBlock.findMany({
        orderBy: { blockedAt: "desc" },
        take: 10,
        select: { email: true, reason: true, blockedAt: true },
      }),
    },
    note:
      "Aggregated global data only. No student academic records or HR private evaluations exposed.",
  });
}
