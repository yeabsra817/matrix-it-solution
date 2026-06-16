import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { redirectPath } from "@/lib/auth-service";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }
    return NextResponse.json({
      authenticated: true,
      redirect: redirectPath(session),
      user: {
        email: session.email,
        fullName: session.fullName,
        role: session.role,
        schoolCode: session.schoolCode,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
