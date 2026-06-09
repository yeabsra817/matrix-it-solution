"use client";

import { useEffect, useState } from "react";

export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const reload = () => {
    setLoading(true);
    setError("");
    fetch(url, { credentials: "same-origin" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setError(d.error || `Request failed (${r.status})`);
          setData(null);
        } else if (d.error) {
          setError(d.error);
          setData(null);
        } else {
          setData(d);
        }
      })
      .catch(() => setError("Request failed"))
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
