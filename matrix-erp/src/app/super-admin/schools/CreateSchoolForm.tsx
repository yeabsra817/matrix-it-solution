"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function CreateSchoolForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [nextCode, setNextCode] = useState("001");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/super-admin/schools", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (d.nextCode) setNextCode(d.nextCode);
        if (d.error) setError(d.error);
      })
      .catch(() => setError("Could not load next school code"));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/super-admin/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ name: form.get("name") }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) setError(data.error || "Failed");
    else {
      setMessage(`School ${data.code} created with isolated database.`);
      if (data.nextAvailableCode) setNextCode(data.nextAvailableCode);
      e.currentTarget.reset();
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3">
      <p className="text-sm text-slate-400">
        Only Super Admin can create schools. Codes are auto-assigned sequentially:
        001, 002, 003… (3 digits, no letters, no skipping).
      </p>
      <div className="grid md:grid-cols-3 gap-3 items-end">
        <div>
          <label className="label">Next School Code (auto)</label>
          <input className="input bg-[#1a2744]" value={nextCode} readOnly />
        </div>
        <div>
          <label className="label">School Name</label>
          <input className="input" name="name" placeholder="School name" required />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create School"}
        </button>
      </div>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <p className="text-red-300">{error}</p>}
    </form>
  );
}
