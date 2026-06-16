import { UserSyncPanel } from "@/components/UserSyncPanel";
import { getSchoolDb } from "@/lib/school-db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SchoolAdminPage() {
  const session = await getSession();
  if (!session?.schoolCode) {
    return (
      <div className="card">
        <p className="text-slate-400">Please sign in to access school admin.</p>
      </div>
    );
  }

  let settings = null;
  try {
    const db = getSchoolDb(session.schoolCode);
    settings = await db.schoolSettings.findUnique({ where: { id: "default" } });
  } catch (err) {
    console.warn("[school-admin] settings load skipped:", err);
  }

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
      <UserSyncPanel session={session} mode="overview" />
    </div>
  );
}
