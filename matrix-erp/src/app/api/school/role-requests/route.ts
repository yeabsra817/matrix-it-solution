import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission, requireSession } from "@/lib/api-auth";
import { masterDb } from "@/lib/master-db";
import { logFromSession } from "@/lib/audit";
import { notifyMaster } from "@/lib/notifications";

const schema = z.object({
  roleName: z.string(),
  userEmail: z.string().email(),
  fullName: z.string().min(2),
});

export async function POST(req: Request) {
  const { session, response } = await requirePermission("requestRoles");
  if (response) return response;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const created = await masterDb.roleRequest.create({
    data: {
      schoolCode: session!.schoolCode!,
      requestedBy: session!.email,
      roleName: parsed.data.roleName,
      userEmail: parsed.data.userEmail.toLowerCase(),
      fullName: parsed.data.fullName,
    },
  });

  await logFromSession(
    session!,
    "ROLE_REQUEST_SUBMIT",
    "RoleRequest",
    created.id,
    parsed.data.roleName
  );

  await notifyMaster({
    targetRole: "SUPER_ADMIN",
    schoolCode: session!.schoolCode,
    title: "New Role Request",
    message: `Director requested ${parsed.data.roleName} for ${parsed.data.fullName} at school ${session!.schoolCode}.`,
    type: "ROLE",
  });

  return NextResponse.json({ ok: true, id: created.id });
}

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  const requests = await masterDb.roleRequest.findMany({
    where: { schoolCode: session!.schoolCode || "" },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ requests });
}
