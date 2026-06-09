import { masterDb } from "./master-db";
import { getSchoolDb } from "./school-db";
import type { SessionUser } from "./session";

export async function logMasterAudit(params: {
  actorEmail: string;
  actorRole: string;
  schoolCode?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
}) {
  await masterDb.auditLog.create({
    data: {
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      schoolCode: params.schoolCode ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      details: params.details,
    },
  });
}

export async function logSchoolAudit(
  schoolCode: string,
  params: {
    actorEmail: string;
    actorRole: string;
    action: string;
    entity?: string;
    entityId?: string;
    details?: string;
  }
) {
  const db = getSchoolDb(schoolCode);
  await db.auditLog.create({ data: params });
}

export async function logFromSession(
  session: SessionUser,
  action: string,
  entity?: string,
  entityId?: string,
  details?: string
) {
  if (session.role === "SUPER_ADMIN") {
    await logMasterAudit({
      actorEmail: session.email,
      actorRole: session.role,
      schoolCode: session.schoolCode,
      action,
      entity,
      entityId,
      details,
    });
    return;
  }
  if (session.schoolCode) {
    await logSchoolAudit(session.schoolCode, {
      actorEmail: session.email,
      actorRole: session.role,
      action,
      entity,
      entityId,
      details,
    });
    await logMasterAudit({
      actorEmail: session.email,
      actorRole: session.role,
      schoolCode: session.schoolCode,
      action,
      entity,
      entityId,
      details,
    });
  }
}
