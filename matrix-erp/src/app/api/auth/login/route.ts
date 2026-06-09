import { NextResponse } from "next/server";
import { z } from "zod";
import { login, redirectPath } from "@/lib/auth-service";
import { createSession } from "@/lib/session";
import { trackLogin, getClientMeta } from "@/lib/login-tracker";
import { logMasterAudit } from "@/lib/audit";

const schema = z.object({
  schoolCode: z.string().min(1),
  email: z.string().min(1),
  password: z.string().min(1),
  verifyCode: z.string().optional(),
});

function jsonSuccess(message: string, data: Record<string, unknown> = {}) {
  return NextResponse.json({ success: true, message, data, ...data });
}

function jsonError(message: string, status: number, data: Record<string, unknown> = {}) {
  return NextResponse.json(
    { success: false, message, error: message, data },
    { status }
  );
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonError("Invalid request body.", 400);
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Please enter school code, email, and password.", 400);
    }

    const meta = getClientMeta(req);
    const schoolCode =
      parsed.data.schoolCode.toUpperCase() === "ROOT"
        ? null
        : parsed.data.schoolCode.padStart(3, "0");

    const result = await login(
      parsed.data.schoolCode,
      parsed.data.email.trim(),
      parsed.data.password,
      parsed.data.verifyCode
    );

    await trackLogin({
      email: parsed.data.email,
      schoolCode,
      success: result.ok,
      ...meta,
    }).catch((err) => console.error("[login] trackLogin failed:", err));

    if (!result.ok) {
      return jsonError(result.error, 401);
    }

    await createSession(result.user);

    await logMasterAudit({
      actorEmail: result.user.email,
      actorRole: result.user.role,
      schoolCode: result.user.schoolCode,
      action: "LOGIN_SUCCESS",
      details: meta.ipAddress,
    }).catch((err) => console.error("[login] audit failed:", err));

    const redirect = redirectPath(result.user);

    return jsonSuccess("Login successful.", {
      redirect,
      role: result.user.role,
      user: {
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role,
        schoolCode: result.user.schoolCode,
      },
    });
  } catch (err) {
    console.error("[login] unexpected error:", err);
    return jsonError(
      "Login service temporarily unavailable. Please try again.",
      500
    );
  }
}
