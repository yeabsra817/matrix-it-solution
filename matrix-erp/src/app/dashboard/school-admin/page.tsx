import { UserSyncPanel } from "@/components/UserSyncPanel";
import { getSchoolDb } from "@/lib/school-db";
import { getSession } from "@/lib/session";

export default async function SchoolAdminPage() {
  const session = await getSession();
  const db = getSchoolDb(session!.schoolCode!);
  const settings = await db.schoolSettings.findUnique({ where: { id: "default" } });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">School Admin</h2>
      {settings && (
        <div className="card">
          <h3 className="font-semibold">{settings.homepageTitle}</h3>
          <p className="text-slate-400">{settings.homepageMessage}</p>
        </div>
      )}
      <p className="text-slate-400">
        Manage users and settings inside your school only. Cannot create system-wide roles.
      </p>
      <UserSyncPanel session={session!} mode="overview" />
    </div>
  );
}
