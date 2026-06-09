"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  title: string;
  /** Optional fixed roles; if omitted, loads from /api/rbac/creatable-roles */
  allowedRoles?: string[];
  apiUrl?: string;
  extraFields?: Record<string, string>;
};

export function CreateUserForm({
  title,
  allowedRoles,
  apiUrl = "/api/school/users",
  extraFields,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [roles, setRoles] = useState<string[]>(allowedRoles ?? []);
  const [loadingRoles, setLoadingRoles] = useState(!allowedRoles);

  useEffect(() => {
    if (allowedRoles?.length) return;
    setLoadingRoles(true);
    fetch("/api/rbac/creatable-roles", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        setRoles(d.creatableRoles ?? []);
      })
      .catch(() => setError("Could not load allowed roles."))
      .finally(() => setLoadingRoles(false));
  }, [allowedRoles]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const body: Record<string, string> = {
      email: String(form.get("email")),
      fullName: String(form.get("fullName")),
      role: String(form.get("role")),
    };
    if (extraFields) {
      for (const [k, v] of Object.entries(extraFields)) {
        const val = form.get(k);
        if (val) body[k] = String(val);
      }
    }
    if (apiUrl.includes("super-admin")) {
      body.schoolCode = String(form.get("schoolCode") || extraFields?.schoolCode || "");
    }

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else {
      e.currentTarget.reset();
      router.refresh();
    }
  }

  if (loadingRoles) {
    return <p className="text-slate-400">Loading allowed roles...</p>;
  }

  if (!roles.length) {
    return (
      <div className="card">
        <p className="text-slate-400">Your role cannot create users.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      {error && <div className="alert alert-error">{error}</div>}
      {apiUrl.includes("super-admin") && (
        <div>
          <label className="label">School Code</label>
          <input className="input" name="schoolCode" placeholder="001" required />
        </div>
      )}
      <div>
        <label className="label">Full Name</label>
        <input className="input" name="fullName" required />
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" name="email" required />
      </div>
      <div>
        <label className="label">Role</label>
        <select className="input" name="role" required>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      {roles.includes("STUDENT") && (
        <>
          <div>
            <label className="label">Grade Band</label>
            <input className="input" name="gradeBand" placeholder="PRIMARY" />
          </div>
          <div>
            <label className="label">Grade</label>
            <input className="input" name="grade" placeholder="1" />
          </div>
        </>
      )}
      <button className="btn btn-primary" type="submit">
        Save User
      </button>
      <p className="text-xs text-slate-400">
        Default password: 1234 (must change on first login). Hierarchy enforced server-side.
      </p>
    </form>
  );
}
