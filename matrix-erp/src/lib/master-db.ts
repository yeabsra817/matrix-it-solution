import { PrismaClient } from "@/lib/prisma-master";
import { resolveMasterDbUrl, resolveSchoolDbUrl } from "./db-url";

const globalForPrisma = globalThis as unknown as { masterPrisma?: PrismaClient };

function createMasterClient(): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: resolveMasterDbUrl() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export function masterDbUrl(): string {
  return resolveMasterDbUrl();
}

export function getMasterDb(): PrismaClient {
  if (!globalForPrisma.masterPrisma) {
    globalForPrisma.masterPrisma = createMasterClient();
  }
  return globalForPrisma.masterPrisma;
}

/** Cached Prisma client — safe for Vercel serverless warm instances. */
export const masterDb = getMasterDb();

export function getSchoolDbPath(code: string): string {
  const url = resolveSchoolDbUrl(code);
  return url.replace(/^file:/, "");
}

export function schoolDbUrl(code: string): string {
  return resolveSchoolDbUrl(code);
}
