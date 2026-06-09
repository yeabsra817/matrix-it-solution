"use client";

import { useEffect, useState } from "react";

type IntegrityData = {
  policy: { onDuplicate: string; onConflict: string; neverBreak: string[] };
  rulePriority: string[];
  registryInit: { duplicates: string[] };
  roles: { unique: boolean; duplicates: number };
};

export function IntegrityPanel() {
  const [data, setData] = useState<IntegrityData | null>(null);

  useEffect(() => {
    fetch("/api/system/integrity", { credentials: "same-origin" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  return (
    <div className="card space-y-2 text-sm">
      <h3 className="font-semibold">§101 Duplicate Guard Status</h3>
      <p className="text-slate-400">
        Policy: {data.policy.onDuplicate} · Conflict: {data.policy.onConflict}
      </p>
      <p>
        Priority order: {data.rulePriority.join(" → ")}
      </p>
      <p>
        Registry duplicates detected:{" "}
        {data.registryInit.duplicates.length === 0 ? (
          <span className="text-green-400">None</span>
        ) : (
          <span className="text-amber-400">
            {data.registryInit.duplicates.join(", ")}
          </span>
        )}
      </p>
      <p>Roles unique: {data.roles.duplicates === 0 ? "Yes" : "No"}</p>
    </div>
  );
}
