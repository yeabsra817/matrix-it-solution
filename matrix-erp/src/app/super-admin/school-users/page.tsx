import { CreateUserForm } from "@/components/CreateUserForm";
import { masterDb } from "@/lib/master-db";

export default async function SuperAdminSchoolUsersPage() {
  const schools = await masterDb.school.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    select: { code: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Create School Admin or Director</h2>
        <p className="text-slate-400 mt-1">
          Super Admin may create SCHOOL_ADMIN and DIRECTOR only. All other users must be
          created through the school hierarchy.
        </p>
      </div>
      {schools.length === 0 ? (
        <div className="card">
          <p className="text-slate-400">Create a school first, then assign admins here.</p>
        </div>
      ) : (
        <CreateUserForm
          title="Platform school user"
          apiUrl="/api/super-admin/school-users"
          allowedRoles={["SCHOOL_ADMIN", "DIRECTOR"]}
          extraFields={{ schoolCode: schools[0]?.code ?? "001" }}
        />
      )}
      {schools.length > 0 && (
        <p className="text-xs text-slate-500">
          Active schools: {schools.map((s) => `${s.code} (${s.name})`).join(", ")}
        </p>
      )}
    </div>
  );
}
