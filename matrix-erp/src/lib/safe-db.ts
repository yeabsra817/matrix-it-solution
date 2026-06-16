/** Safe async wrapper — never throws; returns fallback on error. */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  label = "db"
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[safeAsync:${label}]`, err);
    return fallback;
  }
}

export function safeSync<T>(fn: () => T, fallback: T, label = "sync"): T {
  try {
    return fn();
  } catch (err) {
    console.warn(`[safeSync:${label}]`, err);
    return fallback;
  }
}
