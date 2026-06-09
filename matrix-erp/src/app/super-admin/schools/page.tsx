import { masterDb } from "@/lib/master-db";
import { CreateSchoolForm } from "./CreateSchoolForm";
import { DeleteSchoolButton } from "@/components/DeleteSchoolButton";

export default async function SchoolsPage() {
  const schools = await masterDb.school.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">School Management</h2>
      <p className="text-sm text-slate-400">
        Super Admin only. Each new school receives the next sequential 3-digit code
        (001, 002, 003…) and an isolated tenant database under{" "}
        <code className="text-slate-300">data/schools/</code>.
      </p>
      <CreateSchoolForm />
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => (
              <tr key={s.id}>
                <td>{s.code}</td>
                <td>{s.name}</td>
                <td>
                  <span className="badge">{s.isActive ? "Active" : "Disabled"}</span>
                </td>
                <td className="space-x-2">
                  <form action="/api/super-admin/schools/toggle" method="post" className="inline">
                    <input type="hidden" name="schoolId" value={s.id} />
                    <button className="btn btn-secondary text-xs" type="submit">
                      {s.isActive ? "Disable" : "Enable"}
                    </button>
                  </form>
                  <DeleteSchoolButton code={s.code} name={s.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
