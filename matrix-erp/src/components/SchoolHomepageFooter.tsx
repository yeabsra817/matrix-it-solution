import {
  APP_NAME,
  FOOTER_DEVELOPER,
  FOOTER_SALES_DIRECTOR,
  FOOTER_PHONE,
} from "@/lib/constants";

export function SchoolHomepageFooter() {
  return (
    <footer className="border-t border-[#1f2a44] mt-8 py-6 px-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 text-xs text-slate-500">
        <div className="text-left">
          <p className="font-bold text-slate-300 text-sm">{APP_NAME}</p>
          <p>{FOOTER_DEVELOPER}</p>
          <p>{FOOTER_SALES_DIRECTOR}</p>
          <p>{FOOTER_PHONE}</p>
        </div>
        <p className="text-slate-600 sm:text-right">
          Multi-School SaaS ERP + PMS · Tenant Isolated
        </p>
      </div>
    </footer>
  );
}
