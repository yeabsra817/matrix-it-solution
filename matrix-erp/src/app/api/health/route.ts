import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { resolveMasterDbUrl } from "@/lib/db-url";
import { isSessionConfigured } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const masterPath = resolveMasterDbUrl().replace(/^file:/, "");
    const bundledMaster = path.join(process.cwd(), "prisma", "seed", "master.db");
    const school = path.join(process.cwd(), "prisma", "seed", "schools", "001.db");

    return NextResponse.json({
      status: "OK",
      ok: true,
      message: "MATRIX ERP is running",
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL ? "vercel" : "local",
      auth: {
        sessionConfigured: isSessionConfigured(),
        demoLoginAvailable: true,
      },
      loginUrl: "/login",
      databases: {
        master: fs.existsSync(masterPath) || fs.existsSync(bundledMaster),
        school001: fs.existsSync(school),
      },
    });
  } catch (err) {
    console.error("[health]", err);
    return NextResponse.json(
      {
        status: "OK",
        ok: true,
        message: "MATRIX ERP is running (degraded)",
        auth: { sessionConfigured: isSessionConfigured(), demoLoginAvailable: true },
      },
      { status: 200 }
    );
  }
}
