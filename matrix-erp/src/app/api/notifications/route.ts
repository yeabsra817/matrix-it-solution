import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { masterDb } from "@/lib/master-db";
import { getSchoolDb } from "@/lib/school-db";

export async function GET() {
  try {
    const { session, response } = await requireSession();
    if (response) return response;

    if (session!.role === "SUPER_ADMIN") {
      const notifications = await masterDb.notification.findMany({
        where: {
          OR: [
            { targetEmail: session!.email },
            { targetRole: "SUPER_ADMIN" },
            { targetRole: null, targetEmail: null },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      return NextResponse.json({ notifications });
    }

    if (!session!.schoolCode) {
      return NextResponse.json({ notifications: [] });
    }

    const db = getSchoolDb(session!.schoolCode);
    const notifications = await db.notification.findMany({
      where: {
        OR: [
          { targetEmail: session!.email },
          { targetRole: session!.role },
          { targetRole: null, targetEmail: null },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("[api/notifications] GET error:", err);
    return NextResponse.json(
      { notifications: [], error: "Failed to load notifications" },
      { status: 500 }
    );
  }
}

const patchSchema = z.object({ id: z.string() });

export async function PATCH(req: Request) {
  try {
    const { session, response } = await requireSession();
    if (response) return response;

    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (session!.role === "SUPER_ADMIN") {
      await masterDb.notification.update({
        where: { id: parsed.data.id },
        data: { read: true },
      });
    } else if (session!.schoolCode) {
      const db = getSchoolDb(session!.schoolCode);
      await db.notification.update({
        where: { id: parsed.data.id },
        data: { read: true },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/notifications] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
