"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[GlobalError]", error);
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center p-4 bg-[#0b1220] text-[#e8eefc]">
        <div className="card max-w-md space-y-4 text-center">
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="text-slate-400">
            The application encountered an error. Please try again or return to login.
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <button type="button" className="btn btn-primary" onClick={() => reset()}>
              Try again
            </button>
            <a href="/login" className="btn btn-secondary">
              Go to login
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
