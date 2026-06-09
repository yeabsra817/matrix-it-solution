import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getSchoolDb } from "@/lib/school-db";
import { hasPermission } from "@/lib/rbac";
import { CURRENT_PMS_PERIOD, PMS_WEIGHTS } from "@/lib/constants";
import {
  computeTeacherPmsFromEvaluations,
  getAssignedTeachersForEvaluator,
} from "@/lib/pms-evaluation";
import { logFromSession } from "@/lib/audit";

const submitSchema = z.object({
  teacherUserId: z.string(),
  score: z.coerce.number().min(0).max(100),
  comment: z.string().optional(),
  period: z.string().optional(),
});

export async function GET(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const period =
    new URL(req.url).searchParams.get("period") || CURRENT_PMS_PERIOD;
  const teacherUserId = new URL(req.url).searchParams.get("teacherUserId");

  if (teacherUserId) {
    const pms = await computeTeacherPmsFromEvaluations(
      session!.schoolCode!,
      teacherUserId,
      period
    );
    return NextResponse.json({ pms, weights: PMS_WEIGHTS });
  }

  if (
    hasPermission(session!, "submitTeacherEvaluation") ||
    hasPermission(session!, "viewSchoolAnalytics") ||
    hasPermission(session!, "hrExperience")
  ) {
    const teachers = await getAssignedTeachersForEvaluator(
      session!.schoolCode!,
      session!.id,
      session!.role
    );
    return NextResponse.json({ period, teachers, weights: PMS_WEIGHTS });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  if (!hasPermission(session!, "submitTeacherEvaluation")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = submitSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid evaluation" }, { status: 400 });
  }

  const period = parsed.data.period || CURRENT_PMS_PERIOD;
  const assigned = await getAssignedTeachersForEvaluator(
    session!.schoolCode!,
    session!.id,
    session!.role
  );

  if (
    session!.role !== "HR" &&
    !assigned.some((t) => t.id === parsed.data.teacherUserId)
  ) {
    return NextResponse.json(
      { error: "You can only evaluate assigned teachers." },
      { status: 403 }
    );
  }

  const db = getSchoolDb(session!.schoolCode!);
  await db.teacherEvaluation.upsert({
    where: {
      teacherUserId_evaluatorUserId_period: {
        teacherUserId: parsed.data.teacherUserId,
        evaluatorUserId: session!.id,
        period,
      },
    },
    update: {
      score: parsed.data.score,
      comment: parsed.data.comment,
      evaluatorRole: session!.role,
    },
    create: {
      teacherUserId: parsed.data.teacherUserId,
      evaluatorUserId: session!.id,
      evaluatorRole: session!.role,
      period,
      score: parsed.data.score,
      comment: parsed.data.comment,
    },
  });

  const pms = await computeTeacherPmsFromEvaluations(
    session!.schoolCode!,
    parsed.data.teacherUserId,
    period
  );

  await logFromSession(
    session!,
    "PMS_EVALUATION",
    "TeacherEvaluation",
    parsed.data.teacherUserId
  );

  return NextResponse.json({ ok: true, pms, weights: PMS_WEIGHTS });
}
