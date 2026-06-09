import { ResetPasswordPanel } from "@/components/ResetPasswordPanel";

export default function SchoolAdminPasswordsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Local Password Reset</h2>
      <p className="text-slate-400">Resets user password to default 1234.</p>
      <ResetPasswordPanel />
    </div>
  );
}
