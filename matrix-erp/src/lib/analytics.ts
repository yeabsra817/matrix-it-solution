import { getSchoolDb } from "./school-db";
import { CURRENT_PMS_PERIOD, PMS_WEIGHTS } from "./constants";

export async function computePmsRankings(schoolCode: string, period: string) {
  const db = getSchoolDb(schoolCode);
  const scores = await db.pmsScore.findMany({
    where: { period },
    include: { user: { select: { fullName: true, email: true, role: true } } },
    orderBy: { score: "desc" },
  });

  const byUser = new Map<
    string,
    { userId: string; name: string; role: string; total: number; count: number }
  >();

  for (const s of scores) {
    const existing = byUser.get(s.userId) ?? {
      userId: s.userId,
      name: s.user.fullName,
      role: s.user.role,
      total: 0,
      count: 0,
    };
    existing.total += (s.score / s.maxScore) * 100;
    existing.count += 1;
    byUser.set(s.userId, existing);
  }

  const rankings = [...byUser.values()]
    .map((u) => ({
      userId: u.userId,
      name: u.name,
      role: u.role,
      averageScore: u.count ? Math.round((u.total / u.count) * 100) / 100 : 0,
    }))
    .sort((a, b) => b.averageScore - a.averageScore)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  for (const r of rankings) {
    await db.pmsScore.updateMany({
      where: { userId: r.userId, period },
      data: { rank: r.rank },
    });
  }

  return rankings;
}

export async function computeWeightedPms(schoolCode: string, period: string) {
  const db = getSchoolDb(schoolCode);
  const scores = await db.pmsScore.findMany({ where: { period } });

  const hrRoles = [
    "HR",
    "TEACHER",
    "IT_SUPPORT",
    "ACCOUNTANT",
    "SECURITY",
    "CLEANER",
    "LIBRARIAN",
    "RECEPTIONIST",
    "NURSE",
    "STAFF",
    "TRANSPORT_OFFICER",
    "SCHOOL_ASSISTANT",
  ];
  const studentRoles = ["STUDENT"];
  const parentRoles = ["PARENT"];

  const avg = (categories: string[]) => {
    const filtered = scores.filter((s) => categories.includes(s.category));
    if (!filtered.length) return 0;
    return filtered.reduce((a, s) => a + (s.score / s.maxScore) * 100, 0) / filtered.length;
  };

  const staffScores = await db.user.findMany({
    where: { role: { in: hrRoles as never[] } },
    select: { id: true },
  });
  const staffIds = new Set(staffScores.map((u) => u.id));
  const staffPms = scores.filter((s) => staffIds.has(s.userId));
  const hrAvg = staffPms.length
    ? staffPms.reduce((a, s) => a + (s.score / s.maxScore) * 100, 0) / staffPms.length
    : 0;

  const studentPms = scores.filter((s) => s.category.startsWith("STUDENT"));
  const studentAvg = studentPms.length
    ? studentPms.reduce((a, s) => a + (s.score / s.maxScore) * 100, 0) / studentPms.length
    : 0;

  const parentPms = scores.filter((s) => s.category.startsWith("PARENT"));
  const parentAvg = parentPms.length
    ? parentPms.reduce((a, s) => a + (s.score / s.maxScore) * 100, 0) / parentPms.length
    : 0;

  const overall =
    hrAvg * PMS_WEIGHTS.HR +
    studentAvg * PMS_WEIGHTS.STUDENTS +
    parentAvg * PMS_WEIGHTS.PARENTS;

  return {
    period,
    weights: PMS_WEIGHTS,
    hr: Math.round(hrAvg * 100) / 100,
    students: Math.round(studentAvg * 100) / 100,
    parents: Math.round(parentAvg * 100) / 100,
    overall: Math.round(overall * 100) / 100,
  };
}

