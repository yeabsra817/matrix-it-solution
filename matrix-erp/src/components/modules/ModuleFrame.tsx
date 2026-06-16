"use client";

import { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api-url";

export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const reload = () => {
    setLoading(true);
    setError("");
    fetch(getApiUrl(url), { credentials: "same-origin" })
      .then(async (r) => {
        let d: Record<string, unknown> = {};
        try {
          d = await r.json();
        } catch {
          setError("Could not read server response.");
          setData(null);
          return;
        }
        if (!r.ok) {
          setError((d.error as string) || `Request failed (${r.status})`);
          setData(null);
        } else if (d.error) {
          setError(d.error as string);
          setData(null);
        } else {
          setData(d as T);
        }
      })
      .catch(() => setError("Network error. Please try again."))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    reload();
  }, [url]);
  return { data, error, loading, reload };
}

export function ModuleFrame({
  title,
  children,
  loading,
}: {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      {loading && <p className="text-slate-400">Loading...</p>}
      {children}
    </div>
  );
}
