import { CreateUserForm } from "@/components/CreateUserForm";

export default function HRCreateStaffPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Create Staff</h2>
      <p className="text-slate-400">
        HR creates staff only — not system roles. Default password 1234, must change on
        first login.
      </p>
      <CreateUserForm title="HR Staff Creation" />
    </div>
  );
}
