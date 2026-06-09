import { PrismaClient } from "@/lib/prisma-school";
import { schoolDbUrl } from "./master-db";

const clients = new Map<string, PrismaClient>();

export function getSchoolDb(schoolCode: string): PrismaClient {
  const code = schoolCode.padStart(3, "0");
  const existing = clients.get(code);
  if (existing) return existing;

  const client = new PrismaClient({
    datasources: { db: { url: schoolDbUrl(code) } },
  });
  clients.set(code, client);
  return client;
}

export async function pushSchoolSchema(schoolCode: string): Promise<void> {
  const { execSync } = await import("child_process");
  const url = schoolDbUrl(schoolCode);
  execSync(
    "npx prisma db push --schema=prisma/school/schema.prisma --skip-generate --accept-data-loss",
    {
      env: { ...process.env, SCHOOL_DB_URL: url },
      cwd: process.cwd(),
      stdio: "pipe",
    }
  );
}
