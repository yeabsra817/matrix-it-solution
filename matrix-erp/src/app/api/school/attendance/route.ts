import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getSchoolDb } from "@/lib/school-db";
import { logFromSession } from "@/lib/audit";
import { dualDateLabel } from "@/lib/ethiopian-calendar";

const schema = z.object({
  classId: z.string(),
  date: z.string(),
  records: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(["PRESENT", "ABSENT", "LATE"]),
    })
  ),
});

export async function GET(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  const db = getSchoolDb(session!.schoolCode!);
  const classId = new URL(req.url).searchParams.get("classId");
  const date = new URL(req.url).searchParams.get("date") || new Date().toISOString().slice(0, 10);

  if (!classId) {
    return NextResponse.json({ error: "classId required" }, { status: 400 });
  }

  const enrollments = await db.classEnrollment.findMany({
    where: { classId },
    include: { student: { include: { user: true } } },
  });

  const existing = await db.attendanceRecord.findMany({
    where: { classId, date },
  });

  const students = enrollments.map((e) => ({
    studentId: e.studentId,
    name: e.student.user.fullName,
    status: existing.find((a) => a.studentId === e.studentId)?.status ?? "PRESENT",
  }));

  return NextResponse.json({
    students,
    date,
    dateLabel: dualDateLabel(new Date(date)),
  });
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
  for (const r of parsed.data.records) {
    await db.attendanceRecord.upsert({
      where: {
        classId_studentId_date: {
          classId: parsed.data.classId,
          studentId: r.studentId,
          date: parsed.data.date,
        },
      },
      update: { status: r.status },
      create: {
        classId: parsed.data.classId,
        studentId: r.studentId,
        date: parsed.data.date,
        status: r.status,
        recordedBy: session!.email,
      },
    });
  }

  await logFromSession(session!, "ATTENDANCE_SAVE", "AttendanceRecord", parsed.data.classId);
  return NextResponse.json({ ok: true });
}
