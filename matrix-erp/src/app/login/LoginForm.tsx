"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { APP_NAME, SUPER_ADMIN_SCHOOL_CODE, SYSTEM_CREDIT } from "@/lib/constants";
import { isSuperAdminSchoolCode } from "@/lib/super-admin-code";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [schoolCode, setSchoolCode] = useState("");
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [schoolError, setSchoolError] = useState<string | null>(null);
  const isSuperAdmin = isSuperAdminSchoolCode(schoolCode);

  async function validateSchool(code: string) {
    if (!code.trim()) {
      setSchoolName(null);
      setSchoolError(null);
      return false;
    }
    if (isSuperAdminSchoolCode(code)) {
      setSchoolName("Global Super Admin");
      setSchoolError(null);
      return true;
    }
    try {
      const res = await fetch(
        `/api/auth/validate-school?code=${encodeURIComponent(code.trim())}`,
        { credentials: "same-origin" }
      );
      let data: { valid?: boolean; name?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        setSchoolName(null);
        setSchoolError("Could not verify school code");
        return false;
      }
      if (data.valid) {
        setSchoolName(data.name ?? null);
        setSchoolError(null);
        return true;
      }
      setSchoolName(null);
      setSchoolError(data.error || "Validation Error: School Not Found");
      return false;
    } catch {
      setSchoolName(null);
      setSchoolError("Could not verify school code");
      return false;
    }
  }

  useEffect(() => {
    const prefill = searchParams.get("school");
    if (prefill) {
      setSchoolCode(prefill);
      validateSchool(prefill);
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const code = String(form.get("schoolCode") || "");

    const validSchool = await validateSchool(code);
    if (!validSchool) {
      setLoading(false);
      setError(schoolError || "Invalid school code");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          schoolCode: code.trim(),
          email: String(form.get("email") || "").trim(),
          password: String(form.get("password") || ""),
          verifyCode: String(form.get("verifyCode") || "").trim() || undefined,
        }),
      });

      let data: {
        success?: boolean;
        message?: string;
        error?: string;
        redirect?: string;
        data?: { redirect?: string };
      } = {};

      try {
        data = await res.json();
      } catch {
        setError("Invalid response from server. Please try again.");
        return;
      }

      if (!res.ok || data.success === false) {
        setError(data.message || data.error || "Invalid credentials. Please try again.");
        return;
      }

      const target = data.redirect || data.data?.redirect || "/school-home";
      router.push(target);
      router.refresh();
    } catch (err) {
      console.error("[LoginForm]", err);
      setError("Unable to connect. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="card w-full max-w-md space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">{APP_NAME}</p>
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-sm text-slate-400 mt-1">
            Enter school code (001, 002, 003...) — each school has its own homepage and database.
            Super Admin: <strong>{SUPER_ADMIN_SCHOOL_CODE}</strong>.
          </p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <div>
          <label className="label">School Code</label>
          <input
            className="input"
            name="schoolCode"
            value={schoolCode}
            onChange={(e) => setSchoolCode(e.target.value)}
            onBlur={() => validateSchool(schoolCode)}
            placeholder="001 or ROOT"
            required
          />
          {schoolName && (
            <p className="text-sm text-green-400 mt-1">✓ {schoolName} loaded</p>
          )}
          {schoolError && <p className="text-sm text-red-300 mt-1">{schoolError}</p>}
          {schoolName && schoolCode && !schoolError && !isSuperAdmin && (
            <Link
              href={`/school/${schoolCode.padStart(3, "0")}`}
              className="text-sm text-blue-400 mt-2 inline-block hover:underline"
            >
              View {schoolName} homepage →
            </Link>
          )}
        </div>
        <div>
          <label className="label">Email or Username</label>
          <input
            className="input"
            type="text"
            name="email"
            placeholder="you@school.edu or username"
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </div>
        {isSuperAdmin && (
          <div>
            <label className="label">Verification Code</label>
            <input
              className="input"
              type="password"
              name="verifyCode"
              placeholder="Super Admin secret code"
              autoComplete="one-time-code"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Super Admin requires verification in addition to password.
            </p>
          </div>
        )}
        <p className="text-xs text-slate-500">
          Demo school 001: director@001.edu, admin@001.edu, hr@001.edu, teacher@001.edu,
          student@001.edu — password <strong>1234</strong> (change to 6-digit on first login)
        </p>
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <p className="text-center text-xs text-slate-500 pt-2">{SYSTEM_CREDIT}</p>
      </form>
    </div>
  );
}
