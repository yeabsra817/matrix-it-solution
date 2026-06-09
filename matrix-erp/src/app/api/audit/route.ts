import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { masterDb } from "@/lib/master-db";
import { getSchoolDb } from "@/lib/school-db";

export async function GET(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const limit = Math.min(
    parseInt(new URL(req.url).searchParams.get("limit") || "50", 10),
    200
  );

  if (session!.role === "SUPER_ADMIN") {
    const logs = await masterDb.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    const logins = await masterDb.loginLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ auditLogs: logs, loginLogs: logins });
  }

  if (!session!.schoolCode) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getSchoolDb(session!.schoolCode);
  const [auditLogs, loginLogs] = await Promise.all([
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit }),
    db.loginLog.findMany({ orderBy: { createdAt: "desc" }, take: limit }),
  ]);

  return NextResponse.json({ auditLogs, loginLogs });
}
