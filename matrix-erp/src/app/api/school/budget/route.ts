import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getSchoolDb } from "@/lib/school-db";
import { masterDb } from "@/lib/master-db";
import { logFromSession } from "@/lib/audit";

const budgetSchema = z.object({
  fiscalYear: z.string(),
  category: z.string(),
  allocated: z.number().positive(),
  description: z.string().optional(),
});

const txSchema = z.object({
  budgetId: z.string(),
  amount: z.number().positive(),
  note: z.string().optional(),
});

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!session!.schoolCode) {
    return NextResponse.json({ error: "School required" }, { status: 400 });
  }

  const school = await masterDb.school.findUnique({
    where: { code: session!.schoolCode },
  });

  const db = getSchoolDb(session!.schoolCode);
  const budgets = await db.schoolBudget.findMany({
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: { fiscalYear: "desc" },
  });

  const summary = budgets.reduce(
    (acc, b) => {
      acc.allocated += b.allocated;
      acc.spent += b.spent;
      return acc;
    },
    { allocated: 0, spent: 0 }
  );

  return NextResponse.json({
    enabled: school?.budgetEnabled ?? true,
    budgets,
    summary,
    remaining: summary.allocated - summary.spent,
  });
}

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!["DIRECTOR", "ACCOUNTANT", "SCHOOL_ADMIN"].includes(session!.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (body.budgetId) {
    const parsed = txSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid transaction" }, { status: 400 });
    }
    const db = getSchoolDb(session!.schoolCode!);
    const budget = await db.schoolBudget.findUnique({
      where: { id: parsed.data.budgetId },
    });
    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }
    if (budget.spent + parsed.data.amount > budget.allocated) {
      return NextResponse.json({ error: "Exceeds allocated budget" }, { status: 400 });
    }

    await db.budgetTransaction.create({
      data: {
        budgetId: parsed.data.budgetId,
        amount: parsed.data.amount,
        note: parsed.data.note,
        createdBy: session!.email,
      },
    });
    await db.schoolBudget.update({
      where: { id: parsed.data.budgetId },
      data: { spent: budget.spent + parsed.data.amount },
    });
    await logFromSession(session!, "BUDGET_SPEND", "SchoolBudget", budget.id);
    return NextResponse.json({ ok: true });
  }

  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid budget" }, { status: 400 });
  }

  const db = getSchoolDb(session!.schoolCode!);
  const row = await db.schoolBudget.upsert({
    where: {
      fiscalYear_category: {
        fiscalYear: parsed.data.fiscalYear,
        category: parsed.data.category,
      },
    },
    update: {
      allocated: parsed.data.allocated,
      description: parsed.data.description,
    },
    create: parsed.data,
  });

  await logFromSession(session!, "BUDGET_CREATE", "SchoolBudget", row.id);
  return NextResponse.json({ ok: true, id: row.id });
}
