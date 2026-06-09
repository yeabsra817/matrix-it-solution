import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { hasPermission } from "@/lib/rbac";
import { computePmsRankings, computeWeightedPms } from "@/lib/analytics";
import { PMS_WEIGHTS } from "@/lib/constants";
import { CURRENT_PMS_PERIOD } from "@/lib/constants";
import { getSchoolDb } from "@/lib/school-db";
import { logFromSession } from "@/lib/audit";

const postSchema = z.object({
  userId: z.string(),
  category: z.string(),
  score: z.number().min(0).max(100),
  period: z.string().optional(),
});

export async function GET(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!session!.schoolCode) {
    return NextResponse.json({ error: "School required" }, { status: 400 });
  }
  if (!hasPermission(session!, "viewSchoolAnalytics") && !hasPermission(session!, "hrExperience")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const period =
    new URL(req.url).searchParams.get("period") || CURRENT_PMS_PERIOD;
  if (new URL(req.url).searchParams.get("weighted") === "1") {
    const weighted = await computeWeightedPms(session!.schoolCode, period);
    return NextResponse.json({ ...weighted, weights: PMS_WEIGHTS });
  }

  const rankings = await computePmsRankings(session!.schoolCode, period);

  const db = getSchoolDb(session!.schoolCode);
  const scores = await db.pmsScore.findMany({
    where: { period },
    include: { user: { select: { fullName: true, role: true } } },
    orderBy: [{ category: "asc" }, { score: "desc" }],
  });

  return NextResponse.json({ period, rankings, scores });
}

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!["DIRECTOR", "HR", "SCHOOL_ADMIN"].includes(session!.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = postSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const period = parsed.data.period || CURRENT_PMS_PERIOD;
  const db = getSchoolDb(session!.schoolCode!);

  await db.pmsScore.upsert({
    where: {
      userId_category_period: {
        userId: parsed.data.userId,
        category: parsed.data.category,
        period,
      },
    },
    update: { score: parsed.data.score },
    create: {
      userId: parsed.data.userId,
      category: parsed.data.category,
      score: parsed.data.score,
      period,
    },
  });

  await computePmsRankings(session!.schoolCode!, period);
  await logFromSession(session!, "PMS_SCORE_UPDATE", "PmsScore", parsed.data.userId);

  return NextResponse.json({ ok: true });
}
