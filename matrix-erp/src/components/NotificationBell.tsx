"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getApiUrl } from "@/lib/api-url";

const NOTIFICATIONS_API = "/api/notifications";
const POLL_INTERVAL_MS = 30_000;

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

async function parseJsonSafe(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (typeof window === "undefined") return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(getApiUrl(NOTIFICATIONS_API), {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        signal: controller.signal,
        cache: "no-store",
      });

      const data = await parseJsonSafe(res);

      if (!mountedRef.current || controller.signal.aborted) return;

      if (!res.ok) {
        const message =
          typeof data.error === "string"
            ? data.error
            : `Notifications unavailable (${res.status})`;
        console.warn("[NotificationBell] GET failed:", res.status, message);
        setItems([]);
        setError(message);
        return;
      }

      const notifications = Array.isArray(data.notifications)
        ? (data.notifications as Notification[])
        : [];

      setItems(notifications);
      setError(null);
    } catch (err) {
      if (!mountedRef.current || controller.signal.aborted) return;

      const isAbort = err instanceof DOMException && err.name === "AbortError";
      if (isAbort) return;

      const message =
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Could not reach notifications service"
          : err instanceof Error
            ? err.message
            : "Unknown error loading notifications";

      console.error("[NotificationBell] Failed to fetch notifications:", err);
      setItems([]);
      setError(message);
    } finally {
      if (mountedRef.current && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();

    const intervalId = window.setInterval(load, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      window.clearInterval(intervalId);
    };
  }, [load]);

  async function markRead(id: string) {
    if (typeof window === "undefined") return;

    try {
      const res = await fetch(getApiUrl(NOTIFICATIONS_API), {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
        cache: "no-store",
      });

      if (!res.ok) {
        const data = await parseJsonSafe(res);
        console.warn(
          "[NotificationBell] PATCH failed:",
          res.status,
          data.error ?? "mark read failed"
        );
        return;
      }

      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("[NotificationBell] Failed to mark notification read:", err);
    }
  }

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        className="btn btn-secondary w-full md:w-auto"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        Alerts {unread > 0 ? `(${unread})` : ""}
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-y-auto rounded-lg border border-[#334155] bg-[#0f172a] p-2 shadow-xl md:right-0 md:left-auto md:w-80">
          {loading && (
            <p className="p-2 text-sm text-slate-400">Loading alerts...</p>
          )}
          {!loading && error && (
            <p className="p-2 text-sm text-amber-300/90" role="status">
              {error}
            </p>
          )}
          {!loading && !error && items.length === 0 && (
            <p className="p-2 text-sm text-slate-400">No alerts</p>
          )}
          {!loading &&
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                className={`mb-1 w-full rounded p-2 text-left text-sm ${
                  n.read ? "opacity-60" : "bg-[#1a2744]"
                }`}
                onClick={() => markRead(n.id)}
              >
                <p className="font-semibold">{n.title}</p>
                <p className="text-slate-400">{n.message}</p>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
