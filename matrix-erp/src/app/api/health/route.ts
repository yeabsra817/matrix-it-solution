import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { resolveMasterDbUrl } from "@/lib/db-url";

export async function GET() {
  const masterPath = resolveMasterDbUrl().replace(/^file:/, "");
  const school = path.join(process.cwd(), "prisma", "seed", "schools", "001.db");
  const schoolLocal = path.join(process.cwd(), "data", "schools", "001.db");

  return NextResponse.json({
    ok: true,
    message: "MATRIX ERP is running",
    environment: process.env.VERCEL ? "vercel" : "local",
    loginUrl: "/login",
    databases: {
      master: fs.existsSync(masterPath),
      school001: fs.existsSync(school) || fs.existsSync(schoolLocal),
      masterPath: process.env.NODE_ENV === "development" ? masterPath : undefined,
    },
  });
}
