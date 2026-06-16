"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { APP_NAME, SUPER_ADMIN_SCHOOL_CODE, SYSTEM_CREDIT } from "@/lib/constants";
import { isSuperAdminSchoolCode } from "@/lib/super-admin-code";
import { fetchJsonSafe } from "@/lib/fetch-json";
import { saveClientSession, getClientSession } from "@/lib/client-session";
import { redirectForUser } from "@/lib/demo-fallback-auth";
import type { Role } from "@/lib/constants";

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
    if (/^\d{1,3}$/.test(code.trim())) {
      setSchoolName(`School ${code.trim().padStart(3, "0")}`);
      setSchoolError(null);
    }

    const { ok, data } = await fetchJsonSafe<{
      valid?: boolean;
      name?: string;
      error?: string;
    }>(`/api/auth/validate-school?code=${encodeURIComponent(code.trim())}`);

    if (ok && data.valid) {
      setSchoolName(data.name ?? null);
      setSchoolError(null);
      return true;
    }

    if (/^\d{1,3}$/.test(code.trim())) {
      return true;
    }

    setSchoolName(null);
    setSchoolError(
      (data.error as string) || "School code not found. Use 001 for demo or ROOT for Super Admin."
    );
    return false;
  }

  useEffect(() => {
    const prefill = searchParams.get("school");
    if (prefill) {
      setSchoolCode(prefill);
      validateSchool(prefill);
    }

    fetchJsonSafe<{ authenticated?: boolean; redirect?: string }>("/api/auth/session").then(
      ({ ok, data }) => {
        if (ok && data.authenticated && data.redirect) {
          router.replace(data.redirect as string);
        }
      }
    );

    const saved = getClientSession();
    if (saved?.redirect) {
      fetchJsonSafe<{ authenticated?: boolean }>("/api/auth/session").then(({ ok, data }) => {
        if (!ok || !data.authenticated) {
          /* cookie session expired — user can sign in again */
        }
      });
    }
  }, [searchParams, router]);

  async function tryClientFallbackLogin(
    code: string,
    email: string,
    password: string,
    verifyCode?: string
  ): Promise<boolean> {
    const { attemptDemoFallbackLogin } = await import("@/lib/demo-fallback-auth");
    const result = attemptDemoFallbackLogin({
      schoolCode: code,
      email,
      password,
      verifyCode,
    });
    if (!result.ok) return false;

    const redirect = redirectForUser(result.user);
    saveClientSession({
      email: result.user.email,
      fullName: result.user.fullName,
      role: result.user.role,
      schoolCode: result.user.schoolCode,
      redirect,
      savedAt: Date.now(),
    });

    const res = await fetchJsonSafe<{
      success?: boolean;
      redirect?: string;
      message?: string;
      error?: string;
    }>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolCode: code, email, password, verifyCode }),
    });

    if (res.ok && res.data.success !== false) {
      const target = (res.data.redirect as string) || redirect;
      router.push(target);
      router.refresh();
      return true;
    }

    return false;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const code = String(form.get("schoolCode") || "");
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const verifyCode = String(form.get("verifyCode") || "").trim() || undefined;

    const validSchool = await validateSchool(code);
    if (!validSchool) {
      setLoading(false);
      setError(schoolError || "Invalid school code");
      return;
    }

    const { ok, status, data } = await fetchJsonSafe<{
      success?: boolean;
      message?: string;
      error?: string;
      redirect?: string;
      role?: Role;
      user?: { email: string; fullName: string; role: Role; schoolCode: string | null };
    }>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolCode: code.trim(), email, password, verifyCode }),
    });

    if (ok && data.success !== false) {
      const target = (data.redirect as string) || "/school-home";
      if (data.user) {
        saveClientSession({
          email: data.user.email,
          fullName: data.user.fullName,
          role: data.user.role,
          schoolCode: data.user.schoolCode,
          redirect: target,
          savedAt: Date.now(),
        });
      }
      router.push(target);
      router.refresh();
      setLoading(false);
      return;
    }

    if (status === 401) {
      setError((data.message as string) || (data.error as string) || "Invalid credentials.");
      setLoading(false);
      return;
    }

    const fallbackOk = await tryClientFallbackLogin(code, email, password, verifyCode);
    if (fallbackOk) {
      setLoading(false);
      return;
    }

    setError(
      (data.message as string) ||
        (data.error as string) ||
        "Sign-in could not be completed. Check school code, email, and password."
    );
    setLoading(false);
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
          Demo: school <strong>001</strong> — director@001.edu, hr@001.edu, teacher@001.edu /
          password <strong>1234</strong>. Super Admin: <strong>ROOT</strong> /
          yeabsra45@gmail.com / <strong>227387</strong>
        </p>
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <p className="text-center text-xs text-slate-500 pt-2">{SYSTEM_CREDIT}</p>
      </form>
    </div>
  );
}
