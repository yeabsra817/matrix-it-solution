import Link from "next/link";
import type { HomepageBranding } from "@/lib/school-homepage";
import { ROLE_HOME, ROLE_LABELS, type Role } from "@/lib/constants";
import { dedupeByKey } from "@/lib/duplicate-guard";
import { SchoolHomepageFooter } from "./SchoolHomepageFooter";

const BG: Record<string, string> = {
  gradient: "bg-gradient-to-br from-[#0d1528] via-[#111d35] to-[#0a1020]",
  solid: "bg-[#0d1528]",
  pattern: "bg-[#0d1528] bg-[radial-gradient(circle_at_20%_20%,#1e3a5f_0%,transparent_40%)]",
};

export function SchoolHomepageView({
  data,
  showLogin = true,
  quickLinks,
}: {
  data: HomepageBranding;
  showLogin?: boolean;
  quickLinks?: { href: string; label: string }[];
}) {
  const align =
    data.logoPosition === "left"
      ? "items-start text-left"
      : data.logoPosition === "right"
        ? "items-end text-right"
        : "items-center text-center";

  return (
    <div
      className={`min-h-screen ${BG[data.backgroundStyle] || BG.gradient}`}
      style={{ ["--school-primary" as string]: data.themeColor }}
    >
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <header className={`flex flex-col gap-4 ${align}`}>
          {data.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.logoUrl}
              alt={`${data.schoolName} logo`}
              className="h-20 w-20 object-contain rounded-lg bg-white/5"
            />
          )}
          <div>
            <p className="text-sm uppercase tracking-widest text-slate-400">
              School {data.schoolCode}
            </p>
            <h1
              className="text-3xl md:text-4xl font-bold"
              style={{ color: data.themeColor }}
            >
              {data.homepageTitle}
            </h1>
            <p className="text-lg text-slate-300 mt-1">{data.schoolName}</p>
          </div>
        </header>

        {data.announcementBanner && data.announcement && (
          <div
            className="rounded-lg px-4 py-3 border text-sm"
            style={{
              borderColor: data.themeColor,
              backgroundColor: `${data.themeColor}22`,
            }}
          >
            <strong>Announcement:</strong> {data.announcement}
          </div>
        )}

        <section className="card space-y-3">
          <p className="text-slate-200">{data.homepageMessage}</p>
          {data.welcomeText && (
            <p className="text-slate-400 border-t border-[#1f2a44] pt-3">{data.welcomeText}</p>
          )}
        </section>

        {(data.phone || data.email) && (
          <section className="card">
            <h2 className="font-semibold mb-2">Contact</h2>
            {data.phone && <p>Phone: {data.phone}</p>}
            {data.email && <p>Email: {data.email}</p>}
          </section>
        )}

        {quickLinks && quickLinks.length > 0 && (
          <section className="card">
            <h2 className="font-semibold mb-3">Quick Access</h2>
            <div className="flex flex-wrap gap-2">
              {quickLinks.map((l) => (
                <Link key={l.href} href={l.href} className="btn btn-secondary text-sm">
                  {l.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {showLogin && (
          <section className="card">
            <h2 className="font-semibold mb-2">Login Panel</h2>
            <p className="text-sm text-slate-400 mb-3">
              Enter your school code ({data.schoolCode}) and credentials. Wrong code
              blocks access immediately.
            </p>
            <Link
              href={`/login?school=${data.schoolCode}`}
              className="btn btn-primary w-full sm:w-auto"
              style={{ backgroundColor: data.themeColor }}
            >
              Open Sign In
            </Link>
          </section>
        )}
      </div>
      <SchoolHomepageFooter />
    </div>
  );
}

export function roleQuickLinks(role: Role): { href: string; label: string }[] {
  const home = ROLE_HOME[role];
  return dedupeByKey(
    [
      { href: home, label: `${ROLE_LABELS[role]} Dashboard` },
      { href: "/school-home", label: "School Homepage" },
    ],
    (l) => l.href
  );
}
