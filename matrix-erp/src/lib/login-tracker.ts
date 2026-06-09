import { masterDb } from "./master-db";
import { getSchoolDb } from "./school-db";

export async function trackLogin(params: {
  email: string;
  schoolCode: string | null;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}) {
  await masterDb.loginLog.create({
    data: {
      email: params.email.toLowerCase(),
      schoolCode: params.schoolCode,
      success: params.success,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });

  if (params.schoolCode && params.schoolCode !== "ROOT") {
    const db = getSchoolDb(params.schoolCode);
    await db.loginLog.create({
      data: {
        email: params.email.toLowerCase(),
        success: params.success,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }
}

export function getClientMeta(req: Request) {
  return {
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown",
    userAgent: req.headers.get("user-agent") || "unknown",
  };
}
