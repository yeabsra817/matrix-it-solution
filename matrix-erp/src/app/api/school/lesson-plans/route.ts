import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { hasPermission } from "@/lib/rbac";
import { getSchoolDb } from "@/lib/school-db";
import { logFromSession } from "@/lib/audit";

const saveSchema = z.object({
  subjectId: z.string(),
  academicYear: z.string().default("2025"),
  title: z.string().min(2),
  content: z.string().min(10),
});

const actionSchema = z.object({
  id: z.string(),
  action: z.enum(["SUBMIT", "APPROVE", "REJECT"]),
  note: z.string().optional(),
});

async function teacherSubjectIds(db: ReturnType<typeof getSchoolDb>, userId: string) {
  const teacher = await db.teacherProfile.findFirst({
    where: { userId },
    include: {
      assignments: {
        include: { class: { include: { classSubjects: { select: { subjectId: true } } } } },
      },
    },
  });
  const ids = new Set<string>();
  teacher?.assignments.forEach((a) =>
    a.class.classSubjects.forEach((cs) => ids.add(cs.subjectId))
  );
  return ids;
}

export async function GET(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  const db = getSchoolDb(session!.schoolCode!);
  const teacherId = new URL(req.url).searchParams.get("teacherUserId");

  if (session!.role === "TEACHER") {
    const plans = await db.lessonPlan.findMany({
      where: { teacherUserId: session!.id },
      include: { subject: true },
      orderBy: { updatedAt: "desc" },
    });
    const subjects = await db.subject.findMany({
      where: { id: { in: [...(await teacherSubjectIds(db, session!.id))] } },
    });
    return NextResponse.json({ success: true, data: { plans, subjects } });
  }

  if (hasPermission(session!, "approveLessonPlan")) {
    const plans = await db.lessonPlan.findMany({
      where: teacherId ? { teacherUserId: teacherId } : undefined,
      include: { subject: true },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ success: true, data: { plans } });
  }

  return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
}

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  const db = getSchoolDb(session!.schoolCode!);
  const body = await req.json();

  if (body.action) {
    if (!hasPermission(session!, "approveLessonPlan")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }
    const plan = await db.lessonPlan.findUnique({ where: { id: parsed.data.id } });
    if (!plan) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }
    const status =
      parsed.data.action === "APPROVE"
        ? "APPROVED"
        : parsed.data.action === "REJECT"
          ? "REJECTED"
          : plan.status;
    const updated = await db.lessonPlan.update({
      where: { id: plan.id },
      data: {
        status,
        directorNote: parsed.data.note,
        reviewedAt: new Date(),
        reviewedBy: session!.email,
      },
    });
    await logFromSession(
      session!,
      `LESSON_PLAN_${parsed.data.action}`,
      "LessonPlan",
      plan.id
    );
    return NextResponse.json({ success: true, data: { plan: updated } });
  }

  if (!hasPermission(session!, "createLessonPlan")) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Invalid input" }, { status: 400 });
  }

  const allowed = await teacherSubjectIds(db, session!.id);
  if (!allowed.has(parsed.data.subjectId)) {
    return NextResponse.json(
      { success: false, message: "You can only create plans for assigned subjects." },
      { status: 403 }
    );
  }

  const existing = await db.lessonPlan.findUnique({
    where: {
      teacherUserId_subjectId_academicYear: {
        teacherUserId: session!.id,
        subjectId: parsed.data.subjectId,
        academicYear: parsed.data.academicYear,
      },
    },
  });

  if (existing && (existing.status === "APPROVED" || existing.status === "SUBMITTED")) {
    return NextResponse.json(
      { success: false, message: "Plan is locked. Wait for director review." },
      { status: 409 }
    );
  }

  const plan = await db.lessonPlan.upsert({
    where: {
      teacherUserId_subjectId_academicYear: {
        teacherUserId: session!.id,
        subjectId: parsed.data.subjectId,
        academicYear: parsed.data.academicYear,
      },
    },
    update: {
      title: parsed.data.title,
      content: parsed.data.content,
      status: existing?.status === "REJECTED" ? "DRAFT" : existing?.status ?? "DRAFT",
    },
    create: {
      teacherUserId: session!.id,
      subjectId: parsed.data.subjectId,
      academicYear: parsed.data.academicYear,
      title: parsed.data.title,
      content: parsed.data.content,
      status: "DRAFT",
    },
  });

  await logFromSession(session!, "LESSON_PLAN_SAVE", "LessonPlan", plan.id);
  return NextResponse.json({ success: true, data: { plan } });
}

export async function PATCH(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!hasPermission(session!, "createLessonPlan")) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const id = body.id as string;
  if (!id) {
    return NextResponse.json({ success: false, message: "id required" }, { status: 400 });
  }
  const db = getSchoolDb(session!.schoolCode!);
  const plan = await db.lessonPlan.findUnique({ where: { id } });
  if (!plan || plan.teacherUserId !== session!.id) {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 403 });
  }
  if (plan.status === "APPROVED" || plan.status === "SUBMITTED") {
    return NextResponse.json({ success: false, message: "Plan is locked." }, { status: 409 });
  }
  const updated = await db.lessonPlan.update({
    where: { id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });
  await logFromSession(session!, "LESSON_PLAN_SUBMIT", "LessonPlan", id);
  return NextResponse.json({ success: true, data: { plan: updated } });
}
