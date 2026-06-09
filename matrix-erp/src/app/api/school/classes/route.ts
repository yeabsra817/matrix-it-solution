import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getSchoolDb } from "@/lib/school-db";
import { ALL_GRADES } from "@/lib/constants";
import { logFromSession } from "@/lib/audit";

const schema = z.object({
  gradeBand: z.enum(["KG", "PRIMARY", "SECONDARY"]),
  grade: z.string(),
  section: z.string().default("A"),
  name: z.string(),
});

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  const db = getSchoolDb(session!.schoolCode!);
  const classes = await db.schoolClass.findMany({
    include: {
      enrollments: { include: { student: { include: { user: true } } } },
      assignments: { include: { teacher: { include: { user: true } } } },
    },
    orderBy: [{ gradeBand: "asc" }, { grade: "asc" }],
  });
  return NextResponse.json({ classes, grades: ALL_GRADES });
}

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!["DIRECTOR", "SCHOOL_ADMIN"].includes(session!.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!ALL_GRADES.includes(parsed.data.grade)) {
    return NextResponse.json({ error: "Invalid grade for KG–10 structure" }, { status: 400 });
  }

  const db = getSchoolDb(session!.schoolCode!);
  const existing = await db.schoolClass.findFirst({
    where: {
      grade: parsed.data.grade,
      section: parsed.data.section,
      gradeBand: parsed.data.gradeBand,
    },
  });
  if (existing) {
    return NextResponse.json({ error: "Class already exists" }, { status: 409 });
  }

  const row = await db.schoolClass.create({ data: parsed.data });
  await logFromSession(session!, "CLASS_CREATE", "SchoolClass", row.id);
  return NextResponse.json({ ok: true, id: row.id });
}
