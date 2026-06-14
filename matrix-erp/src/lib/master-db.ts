import { PrismaClient } from "@/lib/prisma-master";
import { resolveMasterDbUrl, resolveSchoolDbUrl } from "./db-url";

const globalForPrisma = globalThis as unknown as { masterPrisma?: PrismaClient };

export function masterDbUrl(): string {
  return resolveMasterDbUrl();
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
  const url = resolveSchoolDbUrl(code);
  return url.replace(/^file:/, "");
}

export function schoolDbUrl(code: string): string {
  return resolveSchoolDbUrl(code);
}
