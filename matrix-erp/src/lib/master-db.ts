import { PrismaClient } from "@/lib/prisma-master";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as { masterPrisma?: PrismaClient };

export function masterDbUrl(): string {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const legacy = path.join(process.cwd(), "prisma", "master", "data", "master.db");
  const target = path.join(dir, "master.db");
  if (!fs.existsSync(target) && fs.existsSync(legacy)) {
    fs.copyFileSync(legacy, target);
  }
  const dbPath = target.replace(/\\/g, "/");
  return `file:${dbPath}`;
}

export const masterDb =
  globalForPrisma.masterPrisma ??
  new PrismaClient({
    datasources: { db: { url: masterDbUrl() } },
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
