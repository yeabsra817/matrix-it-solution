import { NextResponse } from "next/server";
import { getSession } from "./session";
import {
  assertSchoolScope,
  canCreateUser,
  hasPermission,
  type PERMISSIONS,
} from "./rbac";
import type { Role } from "./constants";

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, response: null };
}

export async function requireRoles(roles: Role[]) {
  const { session, response } = await requireSession();
  if (response) return { session: null, response };
  if (!roles.includes(session!.role)) {
    return {
      session: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session: session!, response: null };
}

export async function requirePermission(key: keyof typeof PERMISSIONS) {
  const { session, response } = await requireSession();
  if (response) return { session: null, response };
  if (!hasPermission(session!, key)) {
    return {
      session: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session: session!, response: null };
}

export async function requireSchoolTenant(schoolCode: string) {
  const { session, response } = await requireSession();
  if (response) return { session: null, response };
  if (!assertSchoolScope(session!, schoolCode)) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Forbidden — school tenant isolation." },
        { status: 403 }
      ),
    };
  }
  return { session: session!, response: null };
}

export async function requireCanCreateUser(targetRole: Role, schoolCode?: string) {
  const { session, response } = await requireSession();
  if (response) return { session: null, response };

  if (!canCreateUser(session!, targetRole)) {
    return {
      session: null,
      response: NextResponse.json(
        {
          error: `Forbidden — ${session!.role} cannot create ${targetRole}.`,
        },
        { status: 403 }
      ),
    };
  }

  if (session!.role !== "SUPER_ADMIN" && schoolCode) {
    if (!session!.schoolCode || !assertSchoolScope(session!, schoolCode)) {
      return {
        session: null,
        response: NextResponse.json(
          { error: "Forbidden — invalid school scope." },
          { status: 403 }
        ),
      };
    }
  }

  return { session: session!, response: null };
}
