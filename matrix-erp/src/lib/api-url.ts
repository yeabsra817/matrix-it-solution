/**
 * Production-safe API URL builder.
 * Uses NEXT_PUBLIC_API_URL when set; otherwise same-origin relative paths.
 */
export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL?.trim().replace(/\/$/, "");
  if (base) return base;

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "";
}

export function getApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${normalized}` : normalized;
}
