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
    if (!fs.existsSync(src)) return false;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    return fs.existsSync(dest);
  } catch {
    return fs.existsSync(dest);
  }
}

function pickBundledMaster(): string | null {
  for (const candidate of [BUNDLED_MASTER, LOCAL_MASTER, LEGACY_MASTER]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function ensureWritableCopy(bundled: string, tmpPath: string): string {
  if (!fs.existsSync(tmpPath) || fs.statSync(tmpPath).size < 1024) {
    tryCopy(bundled, tmpPath);
  }
  return fs.existsSync(tmpPath) ? tmpPath : bundled;
}

/** Resolve master SQLite URL — writable on Vercel via /tmp. */
export function resolveMasterDbUrl(): string {
  const envUrl = process.env.DATABASE_URL?.trim();
  if (envUrl && (envUrl.startsWith("libsql:") || envUrl.startsWith("postgres"))) {
    return envUrl;
  }
  if (envUrl && envUrl.startsWith("file:") && !envUrl.includes("./")) {
    return envUrl;
  }

  const bundled = pickBundledMaster();

  if (isServerless()) {
    const tmpDb = path.join("/tmp", "matrix-master.db");
    if (bundled) {
      return toFileUrl(ensureWritableCopy(bundled, tmpDb));
    }
    return toFileUrl(tmpDb);
  }

  const dir = path.join(process.cwd(), "data");
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* read-only FS */
  }

  const target = path.join(dir, "master.db");
  if (!fs.existsSync(target) && bundled) {
    tryCopy(bundled, target);
  }

  if (fs.existsSync(target)) return toFileUrl(target);
  if (bundled) return toFileUrl(bundled);

  return envUrl || toFileUrl(target);
}

/** Resolve per-school SQLite URL for serverless. */
export function resolveSchoolDbUrl(schoolCode: string): string {
  const envUrl = process.env.SCHOOL_DB_URL?.trim();
  const normalized = schoolCode.padStart(3, "0");

  if (envUrl && envUrl.startsWith("libsql:")) {
    return envUrl;
  }

  const bundled = path.join(process.cwd(), "prisma", "seed", "schools", `${normalized}.db`);
  const local = path.join(process.cwd(), "data", "schools", `${normalized}.db`);
  const source = fs.existsSync(bundled) ? bundled : fs.existsSync(local) ? local : null;

  if (isServerless()) {
    const tmpDb = path.join("/tmp", `matrix-school-${normalized}.db`);
    if (source) {
      return toFileUrl(ensureWritableCopy(source, tmpDb));
    }
    return toFileUrl(tmpDb);
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
