import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getSchoolDb } from "@/lib/school-db";
import { logFromSession } from "@/lib/audit";

const applySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(2),
});

const reviewSchema = z.object({
  id: z.string(),
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().optional(),
});

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  const db = getSchoolDb(session!.schoolCode!);

  const where =
    session!.role === "DIRECTOR" || session!.role === "HR"
      ? {}
      : { userId: session!.id };

  const requests = await db.leaveRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  const body = await req.json();
  const db = getSchoolDb(session!.schoolCode!);

  if (body.status) {
    if (!["DIRECTOR", "HR", "SCHOOL_ADMIN"].includes(session!.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    await db.leaveRequest.update({
      where: { id: parsed.data.id },
      data: {
        status: parsed.data.status,
        reviewedBy: session!.email,
        reviewNote: parsed.data.reviewNote,
      },
    });
    await logFromSession(session!, `LEAVE_${parsed.data.status}`, "LeaveRequest", parsed.data.id);
    return NextResponse.json({ ok: true });
  }

  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const row = await db.leaveRequest.create({
    data: {
      userId: session!.id,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      reason: parsed.data.reason,
      status: "PENDING",
    },
  });
  await logFromSession(session!, "LEAVE_APPLY", "LeaveRequest", row.id);
  return NextResponse.json({ ok: true, id: row.id });
}
