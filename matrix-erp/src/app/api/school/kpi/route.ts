import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { computeWeightedKpis } from "@/lib/kpi";
import { CURRENT_PMS_PERIOD } from "@/lib/constants";
import { getSchoolDb } from "@/lib/school-db";
import { logFromSession } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import { computeTeacherKpiForUser } from "@/lib/activity-kpi";

const schema = z.object({
  name: z.string(),
  roleGroup: z.string().optional(),
  weight: z.number().min(0).max(1),
  value: z.number().optional(),
  target: z.number().optional(),
  period: z.string().optional(),
});

const deleteSchema = z.object({
  name: z.string(),
  roleGroup: z.string().optional(),
  period: z.string().optional(),
});

export async function GET(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!session!.schoolCode) {
    return NextResponse.json({ error: "School required" }, { status: 400 });
  }

  const period =
    new URL(req.url).searchParams.get("period") || CURRENT_PMS_PERIOD;
  const roleGroup = new URL(req.url).searchParams.get("roleGroup") || "TEACHER";
  const teacherUserId = new URL(req.url).searchParams.get("teacherUserId");

  if (session!.role === "TEACHER" || teacherUserId) {
    if (!hasPermission(session!, "viewTeacherKpi") && session!.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const uid = teacherUserId || session!.id;
    const result = await computeTeacherKpiForUser(session!.schoolCode, uid, period);
    if (!result) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  }

  if (
    !hasPermission(session!, "manageKpi") &&
    !hasPermission(session!, "approveKpi") &&
    !hasPermission(session!, "viewSchoolAnalytics")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await computeWeightedKpis(session!.schoolCode, period, roleGroup);
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!hasPermission(session!, "manageKpi")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const period = parsed.data.period || CURRENT_PMS_PERIOD;
  const roleGroup = parsed.data.roleGroup || "TEACHER";
  const db = getSchoolDb(session!.schoolCode!);

  await db.kpiMetric.upsert({
    where: {
      name_period_roleGroup: {
        name: parsed.data.name,
        period,
        roleGroup,
      },
    },
    update: {
      weight: parsed.data.weight,
      ...(parsed.data.value !== undefined ? { value: parsed.data.value } : {}),
      ...(parsed.data.target !== undefined ? { target: parsed.data.target } : {}),
    },
    create: {
      name: parsed.data.name,
      period,
      roleGroup,
      weight: parsed.data.weight,
      value: parsed.data.value ?? 0,
      target: parsed.data.target ?? 100,
    },
  });

  await logFromSession(session!, "KPI_UPDATE", "KpiMetric", parsed.data.name);
  const result = await computeWeightedKpis(session!.schoolCode!, period, roleGroup);
  return NextResponse.json(result);
}

export async function DELETE(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!hasPermission(session!, "manageKpi")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const period = parsed.data.period || CURRENT_PMS_PERIOD;
  const roleGroup = parsed.data.roleGroup || "TEACHER";
  const db = getSchoolDb(session!.schoolCode!);

  await db.kpiMetric.delete({
    where: {
      name_period_roleGroup: {
        name: parsed.data.name,
        period,
        roleGroup,
      },
    },
  });

  await logFromSession(session!, "KPI_DELETE", "KpiMetric", parsed.data.name);
  const result = await computeWeightedKpis(session!.schoolCode!, period, roleGroup);
  return NextResponse.json(result);
}
