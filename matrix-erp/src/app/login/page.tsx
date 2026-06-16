import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { getSession } from "@/lib/session";
import { redirectPath } from "@/lib/auth-service";

export default async function LoginPage() {
  try {
    const session = await getSession();
    if (session) {
      redirect(redirectPath(session));
    }
  } catch (err) {
    console.warn("[LoginPage] session check skipped:", err);
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-400">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
