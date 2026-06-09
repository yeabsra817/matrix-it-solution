import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getCreatableRoles } from "@/lib/rbac";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const roles = getCreatableRoles(session!);
  const options = roles.map((role) => ({
    value: role,
    label: ROLE_LABELS[role as Role],
  }));

  return NextResponse.json({
    actorRole: session!.role,
    creatableRoles: roles,
    options,
  });
}
