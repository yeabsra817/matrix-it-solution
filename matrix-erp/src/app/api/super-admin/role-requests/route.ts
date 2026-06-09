import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { masterDb } from "@/lib/master-db";
import { getSchoolDb } from "@/lib/school-db";
import { schoolRoleFromString } from "@/lib/roles";
import { hashPassword } from "@/lib/password";
import { DEFAULT_PASSWORD } from "@/lib/constants";
import { logFromSession } from "@/lib/audit";
import { notifySchool, notifyMaster } from "@/lib/notifications";

const schema = z.object({
  id: z.string(),
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().optional(),
});

export async function POST(req: Request) {
  const { session, response } = await requirePermission("approveRoles");
  if (response) return response;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const request = await masterDb.roleRequest.findUnique({
    where: { id: parsed.data.id },
  });
  if (!request || request.status !== "PENDING") {
    return NextResponse.json({ error: "Request not found or already reviewed." }, { status: 404 });
  }

  if (parsed.data.status === "APPROVED") {
    const role = schoolRoleFromString(request.roleName);
    if (!role) {
      return NextResponse.json({ error: "Invalid role in request." }, { status: 400 });
    }
    const db = getSchoolDb(request.schoolCode);
    const pwd = await hashPassword(DEFAULT_PASSWORD);
    await db.user.upsert({
      where: { email: request.userEmail.toLowerCase() },
      update: { role, fullName: request.fullName },
      create: {
        email: request.userEmail.toLowerCase(),
        fullName: request.fullName,
        role,
        passwordHash: pwd,
        mustChangePwd: true,
      },
    });
  }

  await masterDb.roleRequest.update({
    where: { id: request.id },
    data: {
      status: parsed.data.status,
      reviewedBy: session!.email,
      reviewNote: parsed.data.reviewNote,
    },
  });

  await logFromSession(
    session!,
    `ROLE_REQUEST_${parsed.data.status}`,
    "RoleRequest",
    request.id,
    `${request.roleName} for ${request.userEmail}`
  );

  await notifySchool(request.schoolCode, {
    targetRole: "DIRECTOR",
    title: `Role Request ${parsed.data.status}`,
    message: `${request.fullName} (${request.roleName}) was ${parsed.data.status.toLowerCase()} by Super Admin.`,
    type: "ROLE",
  });

  await notifyMaster({
    schoolCode: request.schoolCode,
    targetEmail: request.requestedBy,
    title: `Role Request ${parsed.data.status}`,
    message: `Your request for ${request.fullName} as ${request.roleName} was ${parsed.data.status.toLowerCase()}.`,
    type: "ROLE",
  });

  return NextResponse.json({ ok: true });
}
