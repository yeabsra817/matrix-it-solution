import { NextResponse } from "next/server";
import { z } from "zod";
import fs from "fs";
import { requirePermission } from "@/lib/api-auth";
import { masterDb } from "@/lib/master-db";
import { logFromSession } from "@/lib/audit";

const schema = z.object({ code: z.string().min(3).max(3) });

export async function POST(req: Request) {
  const { session, response } = await requirePermission("deleteSchool");
  if (response) return response;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "School code required" }, { status: 400 });
  }

  const code = parsed.data.code.padStart(3, "0");
  const school = await masterDb.school.findUnique({ where: { code } });
  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  await masterDb.school.delete({ where: { code } });

  const dbPath = school.dbPath.replace("file:", "");
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch {
      /* file may be locked; registry removed */
    }
  }

  await logFromSession(session!, "SCHOOL_DELETE", "School", code, school.name);

  return NextResponse.json({ ok: true, code });
}
