import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { hasPermission } from "@/lib/rbac";
import { getSchoolDb } from "@/lib/school-db";
import { logFromSession } from "@/lib/audit";

const createSchema = z.object({
  title: z.string(),
  items: z.string(),
  amount: z.number().positive(),
});

const reviewSchema = z.object({
  id: z.string(),
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().optional(),
});

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!session!.schoolCode) {
    return NextResponse.json({ error: "School context required" }, { status: 400 });
  }
  if (
    !hasPermission(session!, "createPurchases") &&
    !hasPermission(session!, "approvePurchases")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const db = getSchoolDb(session!.schoolCode!);
  const orders = await db.purchaseOrder.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  const body = await req.json();
  const db = getSchoolDb(session!.schoolCode!);

  if (body.status) {
    if (session!.role !== "DIRECTOR") {
      return NextResponse.json({ error: "Director approval required" }, { status: 403 });
    }
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    await db.purchaseOrder.update({
      where: { id: parsed.data.id },
      data: {
        status: parsed.data.status,
        reviewedBy: session!.email,
      },
    });
    await logFromSession(session!, `PURCHASE_${parsed.data.status}`, "PurchaseOrder", parsed.data.id);
    return NextResponse.json({ ok: true });
  }

  if (!hasPermission(session!, "createPurchases")) {
    return NextResponse.json(
      { error: "Only Accountant or School Admin can create purchase requests" },
      { status: 403 }
    );
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const order = await db.purchaseOrder.create({
    data: { ...parsed.data, requestedBy: session!.email, status: "PENDING" },
  });
  await logFromSession(session!, "PURCHASE_REQUEST", "PurchaseOrder", order.id);
  return NextResponse.json({ ok: true, id: order.id });
}
