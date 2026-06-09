import { CreateUserForm } from "@/components/CreateUserForm";

export default function SchoolAdminCreatePage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Create HR</h2>
      <p className="text-slate-400">
        School Admin may create HR only. Directors and School Admins are created by Super
        Admin. Default password: 1234 (must change on first login).
      </p>
      <CreateUserForm title="Create HR" allowedRoles={["HR"]} />
    </div>
  );
}
