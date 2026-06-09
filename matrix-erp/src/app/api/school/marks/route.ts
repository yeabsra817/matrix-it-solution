import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getSchoolDb } from "@/lib/school-db";
import { computeTotalMark } from "@/lib/marks";
import { logFromSession } from "@/lib/audit";
import { UserRole } from "@/lib/prisma-school";

const schema = z.object({
  studentId: z.string(),
  subjectId: z.string(),
  period: z.string(),
  assignmentScore: z.coerce.number().min(0).max(100),
  examScore: z.coerce.number().min(0).max(100),
  finalScore: z.coerce.number().min(0).max(100),
});

async function teacherStudentIds(db: ReturnType<typeof getSchoolDb>, teacherUserId: string) {
  const teacher = await db.teacherProfile.findFirst({
    where: { userId: teacherUserId },
    include: {
      assignments: {
        include: {
          class: {
            include: { enrollments: { select: { studentId: true } } },
          },
        },
      },
    },
  });
  const ids = new Set<string>();
  teacher?.assignments.forEach((a) =>
    a.class.enrollments.forEach((e) => ids.add(e.studentId))
  );
  return ids;
}

export async function GET(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!session!.schoolCode) {
    return NextResponse.json({ error: "School context required" }, { status: 400 });
  }

  const db = getSchoolDb(session!.schoolCode);
  const studentId = new URL(req.url).searchParams.get("studentId");
  let allowedStudentIds: Set<string> | null = null;

  if (session!.role === UserRole.TEACHER) {
    allowedStudentIds = await teacherStudentIds(db, session!.id);
  } else if (session!.role === UserRole.STUDENT) {
    const profile = await db.studentProfile.findFirst({
      where: { userId: session!.id },
    });
    allowedStudentIds = profile ? new Set([profile.id]) : new Set();
  } else if (session!.role === UserRole.PARENT) {
    const parent = await db.parentProfile.findFirst({
      where: { userId: session!.id },
      include: { children: { select: { studentId: true } } },
    });
    allowedStudentIds = new Set(parent?.children.map((c) => c.studentId) ?? []);
  } else if (
    !["DIRECTOR", "SCHOOL_ADMIN", "HR"].includes(session!.role)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const marks = await db.markRecord.findMany({
    where: studentId ? { studentId } : undefined,
    include: {
      student: { include: { user: true } },
      subject: true,
    },
    orderBy: { period: "desc" },
  });

  const filtered =
    allowedStudentIds === null
      ? marks
      : marks.filter((m) => allowedStudentIds!.has(m.studentId));

  const [subjects, classes] = await Promise.all([
    db.subject.findMany({ orderBy: { name: "asc" } }),
    session!.role === UserRole.TEACHER
      ? db.schoolClass.findMany({
          where: {
            assignments: {
              some: { teacher: { userId: session!.id } },
            },
          },
          include: {
            enrollments: {
              include: {
                student: {
                  include: { user: { select: { id: true, fullName: true } } },
                },
              },
            },
            classSubjects: { include: { subject: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    marks: filtered,
    subjects,
    classes,
    weights: { assignment: 30, exam: 30, final: 40 },
  });
}

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!session!.schoolCode) {
    return NextResponse.json({ error: "School context required" }, { status: 400 });
  }
  if (!["TEACHER", "DIRECTOR", "SCHOOL_ADMIN"].includes(session!.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const db = getSchoolDb(session!.schoolCode);

  if (session!.role === "TEACHER") {
    const allowed = await teacherStudentIds(db, session!.id);
    if (!allowed.has(parsed.data.studentId)) {
      return NextResponse.json(
        { error: "Forbidden — student not in your classes." },
        { status: 403 }
      );
    }
  }

  const total = computeTotalMark(
    parsed.data.assignmentScore,
    parsed.data.examScore,
    parsed.data.finalScore
  );

  const record = await db.markRecord.upsert({
    where: {
      studentId_subjectId_period: {
        studentId: parsed.data.studentId,
        subjectId: parsed.data.subjectId,
        period: parsed.data.period,
      },
    },
    update: {
      assignmentScore: parsed.data.assignmentScore,
      examScore: parsed.data.examScore,
      finalScore: parsed.data.finalScore,
      totalScore: total,
    },
    create: { ...parsed.data, totalScore: total },
  });

  await logFromSession(session!, "MARK_SAVE", "MarkRecord", record.id);
  return NextResponse.json({ ok: true, totalScore: total });
}
