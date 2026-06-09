import type { PrismaClient as SchoolClient } from "./prisma-school";

/** Resolve school user by full email or username (local part before @). */
export async function findSchoolUserByIdentifier(
  db: SchoolClient,
  identifier: string
) {
  const raw = identifier.trim();
  const normalized = raw.toLowerCase();

  if (normalized.includes("@")) {
    return db.user.findUnique({ where: { email: normalized } });
  }

  const exact = await db.user.findUnique({ where: { email: normalized } });
  if (exact) return exact;

  const prefixMatch = await db.user.findFirst({
    where: { email: { startsWith: `${normalized}@` } },
  });
  if (prefixMatch) return prefixMatch;

  const all = await db.user.findMany({
    select: { id: true, email: true },
  });
  const matchId = all.find((u) => u.email.split("@")[0]?.toLowerCase() === normalized)?.id;
  if (matchId) {
    return db.user.findUnique({ where: { id: matchId } });
  }

  const byFullName = await db.user.findFirst({
    where: { fullName: raw },
  });
  if (byFullName) return byFullName;

  const firstName = raw.split(/\s+/)[0]?.toLowerCase();
  if (firstName) {
    const users = await db.user.findMany({ select: { id: true, fullName: true } });
    const match = users.find(
      (u) => u.fullName.split(/\s+/)[0]?.toLowerCase() === firstName
    );
    if (match) {
      return db.user.findUnique({ where: { id: match.id } });
    }
  }

  return null;
}

/** Resolve super admin by email or username (local part). */
export async function findSuperAdminByIdentifier(
  masterDb: { superAdmin: { findUnique: Function; findFirst: Function } },
  identifier: string
) {
  const normalized = identifier.trim().toLowerCase();
  if (normalized.includes("@")) {
    return masterDb.superAdmin.findUnique({ where: { email: normalized } });
  }

  const exact = await masterDb.superAdmin.findUnique({ where: { email: normalized } });
  if (exact) return exact;

  return masterDb.superAdmin.findFirst({
    where: { email: { startsWith: `${normalized}@` } },
  });
}
