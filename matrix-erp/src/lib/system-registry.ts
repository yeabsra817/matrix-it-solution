import { registerEndpoint, registerModule } from "./duplicate-guard";

/** Canonical modules — register once at startup; duplicates ignored per §101. */
const CANONICAL_MODULES = [
  { id: "auth", source: "lib/auth-service.ts" },
  { id: "school-auth", source: "lib/school-auth.ts" },
  { id: "school-codes", source: "lib/school-codes.ts" },
  { id: "rbac", source: "lib/rbac.ts" },
  { id: "school-onboarding", source: "lib/school-onboarding.ts" },
  { id: "dashboard-sync", source: "lib/dashboard-sync.ts" },
  { id: "linking", source: "api/school/linking" },
  { id: "pms-evaluation", source: "lib/pms-evaluation.ts" },
  { id: "kpi-templates", source: "lib/kpi-templates.ts" },
  { id: "duplicate-guard", source: "lib/duplicate-guard.ts" },
] as const;

const CANONICAL_ENDPOINTS = [
  { method: "POST", path: "/api/auth/login", handler: "auth/login" },
  { method: "GET", path: "/api/auth/validate-school", handler: "auth/validate-school" },
  { method: "POST", path: "/api/super-admin/schools", handler: "schools/create" },
  { method: "POST", path: "/api/super-admin/schools/delete", handler: "schools/delete" },
  { method: "POST", path: "/api/school/users", handler: "users/create" },
  { method: "POST", path: "/api/school/linking", handler: "linking" },
  { method: "GET", path: "/api/school/dashboard-sync", handler: "dashboard-sync" },
  { method: "POST", path: "/api/school/pms-evaluations", handler: "pms-evaluations" },
  { method: "GET", path: "/api/system/integrity", handler: "system/integrity" },
] as const;

let initialized = false;

export function initializeSystemRegistry() {
  if (initialized) return { skipped: true, duplicates: [] as string[] };
  initialized = true;

  const duplicates: string[] = [];

  for (const mod of CANONICAL_MODULES) {
    const result = registerModule(mod.id, mod.source);
    if (result.duplicate) duplicates.push(`module:${mod.id}`);
  }

  for (const ep of CANONICAL_ENDPOINTS) {
    const result = registerEndpoint(ep.method, ep.path, ep.handler);
    if (result.duplicate) duplicates.push(`endpoint:${ep.method} ${ep.path}`);
  }

  return { skipped: false, duplicates };
}

export function getCanonicalModuleList() {
  return CANONICAL_MODULES.map((m) => m.id);
}
