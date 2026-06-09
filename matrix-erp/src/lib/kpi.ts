import { getSchoolDb } from "./school-db";
import { KPI_TEMPLATES } from "./kpi-templates";

export type KpiResult = {
  name: string;
  weight: number;
  value: number;
  target: number;
  achievement: number;
  weightedScore: number;
};

export async function seedKpiForRoleGroup(
  schoolCode: string,
  period: string,
  roleGroup: string
) {
  const db = getSchoolDb(schoolCode);
  const template = KPI_TEMPLATES[roleGroup];
  if (!template) return;

  const existing = await db.kpiMetric.count({ where: { period, roleGroup } });
  if (existing > 0) return;

  for (const item of template) {
    await db.kpiMetric.create({
      data: {
        name: item.name,
        roleGroup,
        weight: item.weight,
        value: 0,
        target: 100,
        period,
      },
    });
  }
}

export async function computeWeightedKpis(
  schoolCode: string,
  period: string,
  roleGroup: string = "TEACHER"
) {
  const db = getSchoolDb(schoolCode);
  await seedKpiForRoleGroup(schoolCode, period, roleGroup);

  const metrics = await db.kpiMetric.findMany({
    where: { period, roleGroup },
  });

  const results: KpiResult[] = metrics.map((m) => {
    const achievement = m.target > 0 ? (m.value / m.target) * 100 : 0;
    const capped = Math.min(achievement, 100);
    return {
      name: m.name,
      weight: m.weight,
      value: m.value,
      target: m.target,
      achievement: Math.round(achievement * 100) / 100,
      weightedScore: Math.round(capped * m.weight * 100) / 100,
    };
  });

  const totalWeighted = results.reduce((s, r) => s + r.weightedScore, 0);
  const totalWeight = results.reduce((s, r) => s + r.weight, 0);
  const overallScore =
    totalWeight > 0 ? Math.round((totalWeighted / totalWeight) * 100) / 100 : 0;

  return { period, roleGroup, metrics: results, overallScore };
}
