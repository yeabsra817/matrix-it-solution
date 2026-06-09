/**
 * §101 Duplicate Command / Logic Handling
 * Keep originals, ignore duplicates, merge only non-conflicting updates.
 */

export const RULE_PRIORITY = [
  "SUPER_ADMIN",
  "SECURITY",
  "ROLE_ACCESS",
  "DATA_INTEGRITY",
  "FEATURE",
] as const;

export type RulePriority = (typeof RULE_PRIORITY)[number];

export type DuplicateCheckResult<T> =
  | { action: "use_original"; value: T; reason: string }
  | { action: "use_merged"; value: T; reason: string }
  | { action: "reject_duplicate"; reason: string }
  | { action: "reject_conflict"; reason: string; winner: RulePriority };

const moduleRegistry = new Map<string, { registeredAt: number; source: string }>();
const endpointRegistry = new Map<string, string>();
const recentCommands = new Map<string, number>();

const COMMAND_TTL_MS = 30_000;

/** Register a module once; duplicates are ignored (original kept). */
export function registerModule(
  moduleId: string,
  source = "system"
): { registered: boolean; duplicate: boolean } {
  const key = moduleId.trim().toLowerCase();
  if (moduleRegistry.has(key)) {
    return { registered: false, duplicate: true };
  }
  moduleRegistry.set(key, { registeredAt: Date.now(), source });
  return { registered: true, duplicate: false };
}

/** Register API endpoint path once. */
export function registerEndpoint(
  method: string,
  path: string,
  handler: string
): { registered: boolean; duplicate: boolean } {
  const key = `${method.toUpperCase()}:${path.trim().toLowerCase()}`;
  if (endpointRegistry.has(key)) {
    const existing = endpointRegistry.get(key)!;
    if (existing !== handler) {
      return { registered: false, duplicate: true };
    }
    return { registered: false, duplicate: true };
  }
  endpointRegistry.set(key, handler);
  return { registered: true, duplicate: false };
}

export function dedupeByKey<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    const key = keyFn(item);
    if (!seen.has(key)) seen.set(key, item);
  }
  return [...seen.values()];
}

export function hasDuplicateKey<T>(
  items: T[],
  keyFn: (item: T) => string,
  value: string
): boolean {
  return items.some((item) => keyFn(item) === value);
}

/** Merge updates only for keys not in protected set; never overwrite protected. */
export function mergeNonConflicting<T extends Record<string, unknown>>(
  original: T,
  update: Partial<T>,
  protectedKeys: (keyof T)[] = []
): T {
  const merged = { ...original };
  const protectedSet = new Set(protectedKeys);
  for (const [k, v] of Object.entries(update)) {
    const key = k as keyof T;
    if (protectedSet.has(key)) continue;
    if (v === undefined) continue;
    if (merged[key] === v) continue;
    merged[key] = v as T[keyof T];
  }
  return merged;
}

export function resolveRuleConflict(
  ruleA: { priority: RulePriority; rule: string },
  ruleB: { priority: RulePriority; rule: string }
): { winner: RulePriority; rule: string } {
  const idxA = RULE_PRIORITY.indexOf(ruleA.priority);
  const idxB = RULE_PRIORITY.indexOf(ruleB.priority);
  if (idxA <= idxB) return { winner: ruleA.priority, rule: ruleA.rule };
  return { winner: ruleB.priority, rule: ruleB.rule };
}

/** Never break auth or school isolation — security/super-admin always wins. */
export function mustPreserveSecurityRule(
  existingRule: string,
  incomingRule: string
): boolean {
  const securityPatterns = [
    /school.?isolation/i,
    /authentication/i,
    /password/i,
    /super.?admin/i,
    /blocked/i,
    /cross.?school/i,
  ];
  const existingIsSecurity = securityPatterns.some((p) => p.test(existingRule));
  const incomingIsSecurity = securityPatterns.some((p) => p.test(incomingRule));
  if (existingIsSecurity && !incomingIsSecurity) return true;
  if (incomingIsSecurity && !existingIsSecurity) return false;
  return false;
}

/**
 * Detect duplicate API/command within TTL window (same actor + action + payload hash).
 * Returns true if duplicate should be ignored (original already processing/processed).
 */
export function isDuplicateCommand(
  commandKey: string,
  ttlMs = COMMAND_TTL_MS
): boolean {
  const key = commandKey.trim();
  const now = Date.now();
  const last = recentCommands.get(key);
  if (last && now - last < ttlMs) {
    return true;
  }
  recentCommands.set(key, now);
  if (recentCommands.size > 5000) {
    for (const [k, t] of recentCommands) {
      if (now - t > ttlMs) recentCommands.delete(k);
    }
  }
  return false;
}

export function buildCommandKey(
  parts: Record<string, string | number | boolean | null | undefined>
): string {
  return Object.entries(parts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${String(v ?? "")}`)
    .join("|");
}

export function getRegistrySnapshot() {
  return {
    modules: [...moduleRegistry.entries()].map(([id, meta]) => ({
      id,
      ...meta,
    })),
    endpoints: [...endpointRegistry.entries()].map(([key, handler]) => ({
      key,
      handler,
    })),
    activeCommandCache: recentCommands.size,
  };
}
