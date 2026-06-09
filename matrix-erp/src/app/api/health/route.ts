import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const master = path.join(process.cwd(), "data", "master.db");
  const school = path.join(process.cwd(), "data", "schools", "001.db");
  return NextResponse.json({
    ok: true,
    message: "MATRIX ERP is running",
    loginUrl: "http://localhost:3000/login",
    databases: {
      master: fs.existsSync(master),
      school001: fs.existsSync(school),
    },
  });
}
