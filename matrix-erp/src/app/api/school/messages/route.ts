import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getSchoolDb } from "@/lib/school-db";
import { notifySchool } from "@/lib/notifications";
import { logFromSession } from "@/lib/audit";

const schema = z.object({
  toUserId: z.string(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  const db = getSchoolDb(session!.schoolCode!);

  const [inbox, sent] = await Promise.all([
    db.message.findMany({
      where: { toUserId: session!.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.message.findMany({
      where: { fromUserId: session!.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const userIds = [...new Set([...inbox, ...sent].flatMap((m) => [m.fromUserId, m.toUserId]))];
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, fullName: true, role: true },
  });
  const map = Object.fromEntries(users.map((u) => [u.id, u]));

  return NextResponse.json({
    inbox: inbox.map((m) => ({ ...m, from: map[m.fromUserId] })),
    sent: sent.map((m) => ({ ...m, to: map[m.toUserId] })),
  });
}

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!["TEACHER", "PARENT"].includes(session!.role)) {
    return NextResponse.json({ error: "Only Parent and Teacher can message" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const db = getSchoolDb(session!.schoolCode!);
  const toUser = await db.user.findUnique({ where: { id: parsed.data.toUserId } });
  if (!toUser) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });

  const allowed =
    (session!.role === "TEACHER" && toUser.role === "PARENT") ||
    (session!.role === "PARENT" && toUser.role === "TEACHER");
  if (!allowed) {
    return NextResponse.json({ error: "Parent ↔ Teacher only" }, { status: 403 });
  }

  const msg = await db.message.create({
    data: {
      fromUserId: session!.id,
      toUserId: parsed.data.toUserId,
      subject: parsed.data.subject,
      body: parsed.data.body,
    },
  });

  await notifySchool(session!.schoolCode!, {
    targetEmail: toUser.email,
    title: "New Message",
    message: parsed.data.subject,
    type: "MESSAGE",
  });

  await logFromSession(session!, "MESSAGE_SEND", "Message", msg.id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { id } = await req.json();
  const db = getSchoolDb(session!.schoolCode!);
  await db.message.updateMany({
    where: { id, toUserId: session!.id },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}
