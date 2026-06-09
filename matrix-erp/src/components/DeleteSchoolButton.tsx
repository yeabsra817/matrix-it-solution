"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteSchoolButton({ code, name }: { code: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (
      !confirm(
        `Permanently delete school ${code} (${name})? This removes the tenant database.`
      )
    ) {
      return;
    }
    setLoading(true);
    const res = await fetch("/api/super-admin/schools/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ code }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
    else {
      const data = await res.json();
      alert(data.error || "Delete failed");
    }
  }

  return (
    <button
      type="button"
      className="btn btn-secondary text-xs text-red-300"
      onClick={onDelete}
      disabled={loading}
    >
      {loading ? "..." : "Delete"}
    </button>
  );
}
