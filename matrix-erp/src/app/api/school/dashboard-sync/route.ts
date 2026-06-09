import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getRoleDashboardSync } from "@/lib/dashboard-sync";

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!session!.schoolCode) {
    return NextResponse.json({ error: "School context required" }, { status: 400 });
  }

  try {
    const data = await getRoleDashboardSync(session!);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Could not sync dashboard data. Please refresh." },
      { status: 500 }
    );
  }
}
