export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md space-y-4 text-center">
        <h1 className="text-xl font-bold">Page not found</h1>
        <p className="text-slate-400">This page does not exist or you do not have access.</p>
        <a href="/login" className="btn btn-primary inline-block">
          Back to login
        </a>
      </div>
    </div>
  );
}
