import { getSchoolDb } from "./school-db";
import { CURRENT_PMS_PERIOD } from "./constants";
import { computeTeacherPmsFromEvaluations } from "./pms-evaluation";
import { KPI_TEMPLATES } from "./kpi-templates";
import type { KpiResult } from "./kpi";

/** Per-teacher auto KPI from audit logs + evaluations + lesson plan status. */
export async function computeTeacherKpiForUser(
  schoolCode: string,
  teacherUserId: string,
  period: string = CURRENT_PMS_PERIOD
) {
  const db = getSchoolDb(schoolCode);
  const teacher = await db.user.findUnique({ where: { id: teacherUserId } });
  if (!teacher) return null;

  const [markLogs, attendanceLogs, lessonPlan, pms, metrics] = await Promise.all([
    db.auditLog.count({
      where: { action: "MARK_SAVE", actorEmail: teacher.email },
    }),
    db.auditLog.count({
      where: { action: { startsWith: "ATTENDANCE" }, actorEmail: teacher.email },
    }),
    db.lessonPlan.findFirst({
      where: { teacherUserId },
      orderBy: { updatedAt: "desc" },
    }),
    computeTeacherPmsFromEvaluations(schoolCode, teacherUserId, period),
    db.kpiMetric.findMany({ where: { period, roleGroup: "TEACHER" } }),
  ]);

  const template =
    metrics.length > 0
      ? metrics.map((m) => ({ name: m.name, weight: m.weight, target: m.target }))
      : (KPI_TEMPLATES.TEACHER ?? []).map((t) => ({
          name: t.name,
          weight: t.weight,
          target: 100,
        }));

  const valueMap: Record<string, number> = {
    "Student Evaluation": pms.students,
    "Student Performance": pms.overall,
    "Lesson Plan":
      lessonPlan?.status === "APPROVED"
        ? 100
        : lessonPlan?.status === "SUBMITTED"
          ? 60
          : lessonPlan?.status === "REJECTED"
            ? 30
            : 0,
    "Timely Grading": Math.min(100, markLogs * 10),
    Attendance: Math.min(100, attendanceLogs * 8),
    Assignments: Math.min(100, markLogs * 5),
  };

  const results: KpiResult[] = template.map((t) => {
    const value = valueMap[t.name] ?? 0;
    const target = t.target ?? 100;
    const achievement = target > 0 ? (value / target) * 100 : 0;
    const capped = Math.min(achievement, 100);
    return {
      name: t.name,
      weight: t.weight,
      value: Math.round(value * 100) / 100,
      target,
      achievement: Math.round(achievement * 100) / 100,
      weightedScore: Math.round(capped * t.weight * 100) / 100,
    };
  });

  const totalWeighted = results.reduce((s, r) => s + r.weightedScore, 0);
  const totalWeight = results.reduce((s, r) => s + r.weight, 0);
  const overallScore =
    totalWeight > 0 ? Math.round((totalWeighted / totalWeight) * 100) / 100 : 0;

  return {
    period,
    roleGroup: "TEACHER",
    teacherUserId,
    metrics: results,
    overallScore,
    pms,
  };
}
