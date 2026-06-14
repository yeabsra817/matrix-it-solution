import path from "path";
import fs from "fs";

const BUNDLED_MASTER = path.join(process.cwd(), "prisma", "seed", "master.db");
const LOCAL_MASTER = path.join(process.cwd(), "data", "master.db");
const LEGACY_MASTER = path.join(process.cwd(), "prisma", "master", "data", "master.db");

function isServerless(): boolean {
  return !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function toFileUrl(filePath: string): string {
  return `file:${filePath.replace(/\\/g, "/")}`;
}

function tryCopy(src: string, dest: string): boolean {
  try {
    if (fs.existsSync(src) && !fs.existsSync(dest)) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
    return fs.existsSync(dest);
  } catch {
    return fs.existsSync(dest);
  }
}

/** Resolve master SQLite URL — works locally and on Vercel serverless. */
export function resolveMasterDbUrl(): string {
  const envUrl = process.env.DATABASE_URL?.trim();
  if (envUrl && (envUrl.startsWith("libsql:") || envUrl.startsWith("postgres"))) {
    return envUrl;
  }
  if (envUrl && envUrl.startsWith("file:") && !envUrl.includes("./")) {
    return envUrl;
  }

  if (isServerless()) {
    const tmpDb = path.join("/tmp", "matrix-master.db");
    if (!fs.existsSync(tmpDb)) {
      tryCopy(BUNDLED_MASTER, tmpDb) || tryCopy(LOCAL_MASTER, tmpDb);
    }
    if (fs.existsSync(tmpDb)) {
      return toFileUrl(tmpDb);
    }
    if (fs.existsSync(BUNDLED_MASTER)) {
      return toFileUrl(BUNDLED_MASTER);
    }
  }

  const dir = path.join(process.cwd(), "data");
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* read-only FS — use bundled copy */
  }

  const target = path.join(dir, "master.db");
  if (!fs.existsSync(target)) {
    tryCopy(LEGACY_MASTER, target) || tryCopy(BUNDLED_MASTER, target);
  }

  if (fs.existsSync(target)) {
    return toFileUrl(target);
  }
  if (fs.existsSync(BUNDLED_MASTER)) {
    return toFileUrl(BUNDLED_MASTER);
  }

  return envUrl || toFileUrl(target);
}

/** Resolve per-school SQLite URL for serverless (read bundled or copy to /tmp). */
export function resolveSchoolDbUrl(schoolCode: string): string {
  const envUrl = process.env.SCHOOL_DB_URL?.trim();
  const normalized = schoolCode.padStart(3, "0");

  if (envUrl && envUrl.startsWith("libsql:")) {
    return envUrl;
  }

  const bundled = path.join(process.cwd(), "prisma", "seed", "schools", `${normalized}.db`);
  const local = path.join(process.cwd(), "data", "schools", `${normalized}.db`);

  if (isServerless()) {
    const tmpDb = path.join("/tmp", `matrix-school-${normalized}.db`);
    if (!fs.existsSync(tmpDb)) {
      tryCopy(bundled, tmpDb) || tryCopy(local, tmpDb);
    }
    if (fs.existsSync(tmpDb)) return toFileUrl(tmpDb);
    if (fs.existsSync(bundled)) return toFileUrl(bundled);
  }

  if (fs.existsSync(local)) return toFileUrl(local);
  if (fs.existsSync(bundled)) return toFileUrl(bundled);

  const dir = path.join(process.cwd(), "data", "schools");
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* ignore */
  }
  return toFileUrl(path.join(dir, `${normalized}.db`));
}
