import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, getSession } from "@/lib/session";
import { changePassword } from "@/lib/auth-service";
import { validateSixDigitPassword, validateStrongPassword } from "@/lib/password";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
  confirmPassword: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const firstLogin = session.mustChangePwd && session.role !== "SUPER_ADMIN";

  if (firstLogin) {
    if (parsed.data.newPassword !== parsed.data.confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }
    const digitErr = validateSixDigitPassword(parsed.data.newPassword);
    if (digitErr) {
      return NextResponse.json({ error: digitErr }, { status: 400 });
    }
  } else {
    const strength = validateStrongPassword(parsed.data.newPassword);
    if (strength) {
      return NextResponse.json({ error: strength }, { status: 400 });
    }
    if (parsed.data.newPassword === "1234") {
      return NextResponse.json(
        { error: "Default password 1234 is not allowed." },
        { status: 400 }
      );
    }
  }

  const result = await changePassword(
    session,
    parsed.data.currentPassword,
    parsed.data.newPassword
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { ROLE_HOME } = await import("@/lib/constants");
  await createSession({ ...session, mustChangePwd: false });
  return NextResponse.json({
    ok: true,
    redirect: ROLE_HOME[session.role],
  });
}
