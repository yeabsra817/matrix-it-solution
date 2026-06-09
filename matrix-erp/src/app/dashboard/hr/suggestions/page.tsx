import { RoleSuggestionForm } from "@/components/RoleSuggestionForm";
import { getSchoolDb } from "@/lib/school-db";
import { getSession } from "@/lib/session";

export default async function HRSuggestionsPage() {
  const db = getSchoolDb((await getSession())!.schoolCode!);
  const suggestions = await db.roleSuggestion.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Suggest Roles to Director</h2>
      <RoleSuggestionForm />
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Role</th>
              <th>User</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s) => (
              <tr key={s.id}>
                <td>{s.roleName}</td>
                <td>
                  {s.fullName} ({s.userEmail})
                </td>
                <td>{s.note || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
