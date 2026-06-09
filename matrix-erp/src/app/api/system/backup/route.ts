import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { runDatabaseBackup } from "@/lib/backup";
import { logFromSession } from "@/lib/audit";
import { masterDb } from "@/lib/master-db";

export async function POST(req: Request) {
  const cronSecret = process.env.BACKUP_CRON_SECRET;
  const headerSecret = req.headers.get("x-backup-secret");

  if (cronSecret && headerSecret === cronSecret) {
    const result = await runDatabaseBackup();
    return NextResponse.json({ ok: true, ...result });
  }

  const { session, response } = await requirePermission("createSchool");
  if (response) return response;

  const result = await runDatabaseBackup();
  await logFromSession(session!, "DATABASE_BACKUP", "Backup", undefined, result.filePath);
  return NextResponse.json({ ok: true, ...result });
}

export async function GET() {
  const { response } = await requirePermission("createSchool");
  if (response) return response;

  const backups = await masterDb.backupLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ backups });
}
