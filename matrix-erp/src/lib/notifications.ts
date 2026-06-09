import { masterDb } from "./master-db";
import { getSchoolDb } from "./school-db";

export async function notifyMaster(params: {
  schoolCode?: string | null;
  targetRole?: string | null;
  targetEmail?: string | null;
  title: string;
  message: string;
  type?: string;
}) {
  await masterDb.notification.create({
    data: {
      schoolCode: params.schoolCode ?? null,
      targetRole: params.targetRole ?? null,
      targetEmail: params.targetEmail ?? null,
      title: params.title,
      message: params.message,
      type: params.type ?? "SYSTEM",
    },
  });
}

export async function notifySchool(
  schoolCode: string,
  params: {
    targetRole?: string | null;
    targetEmail?: string | null;
    title: string;
    message: string;
    type?: string;
  }
) {
  const db = getSchoolDb(schoolCode);
  await db.notification.create({
    data: {
      targetRole: params.targetRole ?? null,
      targetEmail: params.targetEmail ?? null,
      title: params.title,
      message: params.message,
      type: params.type ?? "ROLE",
    },
  });
}

export async function broadcastSchoolAlert(
  schoolCode: string,
  title: string,
  message: string,
  type = "SYSTEM"
) {
  await notifySchool(schoolCode, { title, message, type });
  await notifyMaster({ schoolCode, title, message, type });
}
