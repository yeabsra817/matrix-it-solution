"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SCHOOL_ROLES } from "@/lib/constants";

export function RoleRequestForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/school/role-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roleName: form.get("roleName"),
        userEmail: form.get("userEmail"),
        fullName: form.get("fullName"),
      }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else {
      e.currentTarget.reset();
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="card grid md:grid-cols-4 gap-3 items-end">
      <div>
        <label className="label">Full Name</label>
        <input className="input" name="fullName" required />
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" name="userEmail" required />
      </div>
      <div>
        <label className="label">Role</label>
        <select className="input" name="roleName" required>
          {SCHOOL_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <button className="btn btn-primary" type="submit">
        Submit Request
      </button>
      {error && <p className="text-red-300 md:col-span-4">{error}</p>}
    </form>
  );
}
