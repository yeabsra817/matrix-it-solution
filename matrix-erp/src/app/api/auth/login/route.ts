import { NextResponse } from "next/server";
import { z } from "zod";
import { login, redirectPath } from "@/lib/auth-service";
import { createSession } from "@/lib/session";
import { trackLogin, getClientMeta } from "@/lib/login-tracker";
import { logMasterAudit } from "@/lib/audit";
import { attemptDemoFallbackLogin } from "@/lib/demo-fallback-auth";

export const runtime = "nodejs";

const schema = z.object({
  schoolCode: z.string().min(1),
  email: z.string().min(1),
  password: z.string().min(1),
  verifyCode: z.string().optional(),
});

type LoginInput = z.infer<typeof schema>;

function jsonSuccess(message: string, data: Record<string, unknown> = {}) {
  return NextResponse.json({ success: true, message, data, ...data });
}

function jsonError(message: string, status: number, data: Record<string, unknown> = {}) {
  return NextResponse.json(
    { success: false, message, error: message, data },
    { status }
  );
}

function tryDemoLogin(input: LoginInput) {
  return attemptDemoFallbackLogin({
    schoolCode: input.schoolCode,
    email: input.email.trim(),
    password: input.password,
    verifyCode: input.verifyCode,
  });
}

async function finalizeLogin(
  result: { ok: true; user: Parameters<typeof createSession>[0] },
  usedFallback: boolean,
  meta: ReturnType<typeof getClientMeta>
) {
  await createSession(result.user);
  await logMasterAudit({
    actorEmail: result.user.email,
    actorRole: result.user.role,
    schoolCode: result.user.schoolCode,
    action: usedFallback ? "LOGIN_SUCCESS_FALLBACK" : "LOGIN_SUCCESS",
    details: meta.ipAddress,
  }).catch((err) => console.error("[login] audit failed:", err));

  const redirect = redirectPath(result.user);
  return jsonSuccess("Login successful.", {
    redirect,
    role: result.user.role,
    fallback: usedFallback,
    user: {
      email: result.user.email,
      fullName: result.user.fullName,
      role: result.user.role,
      schoolCode: result.user.schoolCode,
    },
  });
}

export async function POST(req: Request) {
  let input: LoginInput | null = null;

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
    input = parsed.data;

    const meta = getClientMeta(req);
    const schoolCode =
      input.schoolCode.toUpperCase() === "ROOT" ? null : input.schoolCode.padStart(3, "0");

    let result = tryDemoLogin(input);
    let usedFallback = result.ok;

    if (!result.ok) {
      const dbResult = await login(
        input.schoolCode,
        input.email.trim(),
        input.password,
        input.verifyCode
      );
      result = dbResult;
    }

    if (!result.ok) {
      const retry = tryDemoLogin(input);
      if (retry.ok) {
        result = retry;
        usedFallback = true;
      }
    }

    await trackLogin({
      email: input.email,
      schoolCode,
      success: result.ok,
      ...meta,
    }).catch((err) => console.error("[login] trackLogin failed:", err));

    if (!result.ok) {
      return jsonError(result.error, 401);
    }

    try {
      return await finalizeLogin(result, usedFallback, meta);
    } catch (sessionErr) {
      console.error("[login] session error:", sessionErr);
      return jsonError(
        "Could not save your session. Set SESSION_SECRET in Vercel environment variables.",
        500
      );
    }
  } catch (err) {
    console.error("[login] unexpected:", err);
    if (input) {
      const fallback = tryDemoLogin(input);
      if (fallback.ok) {
        try {
          return await finalizeLogin(fallback, true, getClientMeta(req));
        } catch {
          /* fall through */
        }
      }
    }
    return jsonError("Invalid credentials. Check school code, email, and password.", 401);
  }
}
