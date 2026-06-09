import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getSchoolDb } from "@/lib/school-db";
import { logFromSession } from "@/lib/audit";

const schema = z.object({
  classId: z.string(),
  title: z.string().min(1),
  description: z.string(),
  dueDate: z.string(),
});

export async function GET(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  const db = getSchoolDb(session!.schoolCode!);
  const classId = new URL(req.url).searchParams.get("classId");

  const homework = await db.homework.findMany({
    where: classId ? { classId } : undefined,
    include: { class: true },
    orderBy: { dueDate: "desc" },
  });
  return NextResponse.json({ homework });
}

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!["TEACHER", "DIRECTOR"].includes(session!.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const db = getSchoolDb(session!.schoolCode!);
  const row = await db.homework.create({
    data: {
      ...parsed.data,
      dueDate: new Date(parsed.data.dueDate),
      createdBy: session!.email,
    },
  });

  await logFromSession(session!, "HOMEWORK_CREATE", "Homework", row.id);
  return NextResponse.json({ ok: true, id: row.id });
}
