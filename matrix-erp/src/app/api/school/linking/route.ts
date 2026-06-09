import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getSchoolDb } from "@/lib/school-db";
import { hasPermission } from "@/lib/rbac";
import { STUDENT_STATUSES } from "@/lib/constants";
import { logFromSession } from "@/lib/audit";
import { buildCommandKey, isDuplicateCommand } from "@/lib/duplicate-guard";

const linkParentSchema = z.object({
  action: z.literal("link_parent"),
  parentUserId: z.string(),
  studentUserId: z.string(),
  relation: z.string().optional(),
  guardianPhone: z.string().optional(),
});

const enrollSchema = z.object({
  action: z.literal("enroll_class"),
  studentUserId: z.string(),
  classId: z.string(),
});

const statusSchema = z.object({
  action: z.literal("update_status"),
  studentUserId: z.string(),
  status: z.enum(["ACTIVE", "SUSPENDED", "TERMINATED", "TRANSFERRED"]),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianRelation: z.string().optional(),
});

const profileSchema = z.object({
  action: z.literal("update_student"),
  studentUserId: z.string(),
  fullName: z.string().optional(),
  gradeBand: z.string().optional(),
  grade: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianRelation: z.string().optional(),
});

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const db = getSchoolDb(session!.schoolCode!);
  const [students, parents, classes] = await Promise.all([
    db.studentProfile.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        parentLinks: {
          include: {
            parent: { include: { user: { select: { id: true, fullName: true, email: true } } } },
          },
        },
        enrollments: { include: { class: { select: { id: true, name: true } } } },
      },
      orderBy: { user: { fullName: "asc" } },
    }),
    db.parentProfile.findMany({
      include: { user: { select: { id: true, fullName: true, email: true } } },
    }),
    db.schoolClass.findMany({
      select: { id: true, name: true, grade: true, gradeBand: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    syncedAt: new Date().toISOString(),
    students,
    parents,
    classes,
    statuses: STUDENT_STATUSES,
  });
}

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const allowed =
    hasPermission(session!, "registerStudents") ||
    hasPermission(session!, "linkParents");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const db = getSchoolDb(session!.schoolCode!);

  const cmdKey = buildCommandKey({
    action: body.action,
    school: session!.schoolCode,
    actor: session!.id,
    payload: JSON.stringify(body),
  });
  if (isDuplicateCommand(cmdKey)) {
    return NextResponse.json(
      { error: "Duplicate request ignored. Action already submitted." },
      { status: 409 }
    );
  }

  if (body.action === "link_parent") {
    const parsed = linkParentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid link data" }, { status: 400 });
    }
    const parent = await db.parentProfile.findFirst({
      where: { userId: parsed.data.parentUserId },
    });
    const student = await db.studentProfile.findFirst({
      where: { userId: parsed.data.studentUserId },
    });
    if (!parent || !student) {
      return NextResponse.json({ error: "Parent or student not found" }, { status: 404 });
    }
    await db.parentChildLink.upsert({
      where: {
        parentId_studentId: { parentId: parent.id, studentId: student.id },
      },
      update: {
        relation: parsed.data.relation || "Guardian",
        guardianPhone: parsed.data.guardianPhone,
      },
      create: {
        parentId: parent.id,
        studentId: student.id,
        relation: parsed.data.relation || "Guardian",
        guardianPhone: parsed.data.guardianPhone,
      },
    });
    await logFromSession(session!, "LINK_PARENT", "Student", student.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "enroll_class") {
    const parsed = enrollSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid enrollment" }, { status: 400 });
    }
    const student = await db.studentProfile.findFirst({
      where: { userId: parsed.data.studentUserId },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    const existing = await db.classEnrollment.findFirst({
      where: { studentId: student.id, classId: parsed.data.classId },
    });
    if (existing) {
      return NextResponse.json({ error: "Already enrolled in this class" }, { status: 409 });
    }
    await db.classEnrollment.create({
      data: { studentId: student.id, classId: parsed.data.classId },
    });
    await logFromSession(session!, "ENROLL_CLASS", "Student", student.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "update_status") {
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const student = await db.studentProfile.findFirst({
      where: { userId: parsed.data.studentUserId },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    await db.studentProfile.update({
      where: { id: student.id },
      data: {
        status: parsed.data.status,
        guardianName: parsed.data.guardianName,
        guardianPhone: parsed.data.guardianPhone,
        guardianRelation: parsed.data.guardianRelation,
      },
    });
    await logFromSession(session!, "STUDENT_STATUS", "Student", student.id, parsed.data.status);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "update_student") {
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
    }
    const student = await db.studentProfile.findFirst({
      where: { userId: parsed.data.studentUserId },
      include: { user: true },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    if (parsed.data.fullName) {
      await db.user.update({
        where: { id: student.userId },
        data: { fullName: parsed.data.fullName },
      });
    }
    await db.studentProfile.update({
      where: { id: student.id },
      data: {
        gradeBand: parsed.data.gradeBand,
        grade: parsed.data.grade,
        guardianName: parsed.data.guardianName,
        guardianPhone: parsed.data.guardianPhone,
        guardianRelation: parsed.data.guardianRelation,
      },
    });
    await logFromSession(session!, "STUDENT_UPDATE", "Student", student.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
