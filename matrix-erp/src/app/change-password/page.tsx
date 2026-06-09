import { redirect } from "next/navigation";
import { PasswordChangeForm } from "@/components/PasswordChangeForm";
import { getSession } from "@/lib/session";
import { APP_NAME } from "@/lib/constants";

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const firstLogin = !!session.mustChangePwd && session.role !== "SUPER_ADMIN";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">{APP_NAME}</p>
          <h1 className="text-2xl font-bold">Change Your Password</h1>
          <p className="text-sm text-slate-400 mt-1">
            {firstLogin
              ? "Default password (1234) must be changed. Enter a new 6-digit password and confirm it."
              : "Choose a strong password with letters, numbers, and special characters."}
          </p>
        </div>
        <PasswordChangeForm redirectOnSuccess firstLogin={firstLogin} />
      </div>
    </div>
  );
}
