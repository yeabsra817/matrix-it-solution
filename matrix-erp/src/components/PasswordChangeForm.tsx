"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PasswordChangeForm({
  redirectOnSuccess = false,
  firstLogin = false,
}: {
  redirectOnSuccess?: boolean;
  firstLogin?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("newPassword") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    if (firstLogin && newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.get("currentPassword"),
        newPassword,
        confirmPassword,
      }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else {
      setMessage("Password updated.");
      e.currentTarget.reset();
      if (redirectOnSuccess) {
        router.push(data.redirect || "/");
        router.refresh();
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-md space-y-3">
      <h3 className="text-lg font-semibold">Change Password</h3>
      <p className="text-sm text-slate-400">
        {firstLogin
          ? "You must set a new 6-digit password before continuing. Confirm your password."
          : "Minimum 6 characters with letters, numbers, and special characters (#, &, $, %, @)."}
      </p>
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      <div>
        <label className="label">Current Password</label>
        <input
          className="input"
          type="password"
          name="currentPassword"
          required
        />
      </div>
      <div>
        <label className="label">New Password</label>
        <input
          className="input"
          type="password"
          name="newPassword"
          inputMode={firstLogin ? "numeric" : undefined}
          pattern={firstLogin ? "\\d{6}" : undefined}
          maxLength={firstLogin ? 6 : undefined}
          required
        />
      </div>
      {firstLogin && (
        <div>
          <label className="label">Confirm New Password</label>
          <input
            className="input"
            type="password"
            name="confirmPassword"
            inputMode="numeric"
            pattern="\\d{6}"
            maxLength={6}
            required
          />
        </div>
      )}
      <button className="btn btn-primary" type="submit">
        Update Password
      </button>
    </form>
  );
}
