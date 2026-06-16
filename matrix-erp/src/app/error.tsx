"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[Error]", error);
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md space-y-4 text-center">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="text-slate-400">
          We hit a temporary problem loading this page. Please retry or go back to login.
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            Retry
          </button>
          <a href="/login" className="btn btn-secondary">
            Go to login
          </a>
        </div>
      </div>
    </div>
  );
}
