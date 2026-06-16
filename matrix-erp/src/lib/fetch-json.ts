import { getApiUrl } from "./api-url";

export async function fetchJsonSafe<T extends Record<string, unknown> = Record<string, unknown>>(
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T }> {
  try {
    const res = await fetch(getApiUrl(path), {
      credentials: "same-origin",
      ...init,
    });
    let data: T = {} as T;
    try {
      data = (await res.json()) as T;
    } catch {
      data = {} as T;
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: {} as T };
  }
}
