"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BlockUserForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/super-admin/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        reason: form.get("reason"),
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
    <form onSubmit={onSubmit} className="card grid md:grid-cols-3 gap-3 items-end">
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" name="email" required />
      </div>
      <div>
        <label className="label">Reason</label>
        <input className="input" name="reason" />
      </div>
      <button className="btn btn-danger" type="submit">
        Block Globally
      </button>
      {error && <p className="text-red-300 md:col-span-3">{error}</p>}
    </form>
  );
}
