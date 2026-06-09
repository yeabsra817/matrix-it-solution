import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { masterDb, getSchoolDbPath } from "@/lib/master-db";
import { pushSchoolSchema } from "@/lib/school-db";
import { getNextSchoolCode } from "@/lib/school-codes";
import { logFromSession } from "@/lib/audit";
import { notifyMaster } from "@/lib/notifications";
import { initializeSchoolTenant } from "@/lib/school-onboarding";
import { buildCommandKey, isDuplicateCommand } from "@/lib/duplicate-guard";

const createSchema = z.object({
  name: z.string().min(2),
});

export async function GET() {
  const { session, response } = await requirePermission("createSchool");
  if (response) return response;

  const next = await getNextSchoolCode();
  if (!next.ok) {
    return NextResponse.json({ error: next.error }, { status: 400 });
  }

  const schools = await masterDb.school.findMany({
    orderBy: { code: "asc" },
    select: { code: true, name: true, isActive: true },
  });

  return NextResponse.json({
    nextCode: next.code,
    schools,
    rules: {
      format: "3 digits only (001, 002, 003...)",
      sequential: true,
      superAdminOnly: true,
    },
  });
}

export async function POST(req: Request) {
  const { session, response } = await requirePermission("createSchool");
  if (response) return response;

  const body = await req.json();

  if (body.code !== undefined) {
    return NextResponse.json(
      {
        error:
          "School code is auto-assigned by the system. Only the school name is required.",
      },
      { status: 400 }
    );
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "School name is required." }, { status: 400 });
  }

  const next = await getNextSchoolCode();
  if (!next.ok) {
    return NextResponse.json({ error: next.error }, { status: 400 });
  }

  const code = next.code;

  const dupKey = buildCommandKey({
    action: "school_create",
    code,
    name: parsed.data.name,
    actor: session!.id,
  });
  if (isDuplicateCommand(dupKey)) {
    return NextResponse.json(
      { error: "Duplicate school creation request ignored." },
      { status: 409 }
    );
  }

  const existing = await masterDb.school.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json(
      { error: "School code already exists. Original record kept." },
      { status: 409 }
    );
  }

  const dbPath = getSchoolDbPath(code);

  await masterDb.school.create({
    data: {
      code,
      name: parsed.data.name,
      dbPath,
      isActive: true,
    },
  });

  await pushSchoolSchema(code);
  await initializeSchoolTenant(code, parsed.data.name);

  await logFromSession(session!, "SCHOOL_CREATE", "School", code, parsed.data.name);

  await notifyMaster({
    targetRole: "SUPER_ADMIN",
    title: "School Created",
    message: `School ${code} — ${parsed.data.name} tenant database initialized.`,
    type: "SYSTEM",
  });

  const following = await getNextSchoolCode();

  return NextResponse.json({
    ok: true,
    code,
    name: parsed.data.name,
    nextAvailableCode: following.ok ? following.code : null,
  });
}
