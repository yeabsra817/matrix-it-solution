import { masterDb } from "./master-db";
import { getSchoolDb } from "./school-db";

export async function trackLogin(params: {
  email: string;
  schoolCode: string | null;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await masterDb.loginLog.create({
      data: {
        email: params.email.toLowerCase(),
        schoolCode: params.schoolCode,
        success: params.success,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (err) {
    console.warn("[trackLogin] master log skipped:", err);
  }

  if (!params.schoolCode || params.schoolCode === "ROOT") return;

  try {
    const db = getSchoolDb(params.schoolCode);
    await db.loginLog.create({
      data: {
        email: params.email.toLowerCase(),
        success: params.success,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (err) {
    console.warn("[trackLogin] school log skipped:", err);
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
