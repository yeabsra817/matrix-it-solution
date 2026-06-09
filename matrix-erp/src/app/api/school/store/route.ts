import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { hasPermission } from "@/lib/rbac";
import { getSchoolDb } from "@/lib/school-db";
import { logFromSession } from "@/lib/audit";
import { notifySchool } from "@/lib/notifications";

const createSchema = z.object({
  title: z.string(),
  items: z.string(),
  quantity: z.number().int().positive(),
});

const updateSchema = z.object({
  id: z.string(),
  action: z.enum([
    "DIRECTOR_APPROVE",
    "DIRECTOR_REJECT",
    "STORE_ACCEPT",
    "STORE_REJECT",
  ]),
  note: z.string().optional(),
});

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!session!.schoolCode) {
    return NextResponse.json({ error: "School context required" }, { status: 400 });
  }
  if (!hasPermission(session!, "manageStore") && session!.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const db = getSchoolDb(session!.schoolCode!);
  const orders = await db.storeOrder.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  const body = await req.json();
  const db = getSchoolDb(session!.schoolCode!);

  if (body.action) {
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    const order = await db.storeOrder.findUnique({ where: { id: parsed.data.id } });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let status = order.status;
    if (
      parsed.data.action === "DIRECTOR_APPROVE" &&
      hasPermission(session!, "viewSchoolAnalytics")
    ) {
      status = "AT_STORE";
    } else if (
      parsed.data.action === "DIRECTOR_REJECT" &&
      hasPermission(session!, "viewSchoolAnalytics")
    ) {
      status = "REJECTED";
    } else if (
      parsed.data.action === "STORE_ACCEPT" &&
      hasPermission(session!, "manageStore")
    ) {
      status = "ACCEPTED";
    } else if (
      parsed.data.action === "STORE_REJECT" &&
      hasPermission(session!, "manageStore")
    ) {
      status = "REJECTED";
    } else {
      return NextResponse.json({ error: "Forbidden action for role" }, { status: 403 });
    }

    await db.storeOrder.update({
      where: { id: parsed.data.id },
      data: {
        status,
        directorNote: parsed.data.note,
        storeNote: parsed.data.note,
      },
    });
    await logFromSession(session!, `STORE_${parsed.data.action}`, "StoreOrder", order.id);
    return NextResponse.json({ ok: true, status });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const order = await db.storeOrder.create({
    data: { ...parsed.data, requestedBy: session!.email, status: "PENDING_DIRECTOR" },
  });

  await notifySchool(session!.schoolCode!, {
    targetRole: "DIRECTOR",
    title: "Store Purchase Request",
    message: parsed.data.title,
    type: "STORE",
  });

  await logFromSession(session!, "STORE_REQUEST", "StoreOrder", order.id);
  return NextResponse.json({ ok: true, id: order.id });
}
