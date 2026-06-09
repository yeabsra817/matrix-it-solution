import { PrismaClient } from "@/lib/prisma-master";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as { masterPrisma?: PrismaClient };

export const masterDb =
  globalForPrisma.masterPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.masterPrisma = masterDb;
}

export function getSchoolDbPath(code: string): string {
  const normalized = code.padStart(3, "0");
  const dir = path.join(process.cwd(), "data", "schools");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${normalized}.db`);
}

export function schoolDbUrl(code: string): string {
  const dbPath = getSchoolDbPath(code).replace(/\\/g, "/");
  return `file:${dbPath}`;
}
