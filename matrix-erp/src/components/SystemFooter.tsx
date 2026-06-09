import {
  APP_NAME,
  FOOTER_DEVELOPER,
  FOOTER_SALES_DIRECTOR,
  FOOTER_PHONE,
} from "@/lib/constants";

export function SystemFooter() {
  return (
    <footer className="mt-8 border-t border-[#1f2a44] pt-4 text-xs text-slate-500">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
        <div className="text-left">
          <p className="font-semibold text-slate-400">{APP_NAME}</p>
          <p>{FOOTER_DEVELOPER}</p>
          <p>{FOOTER_SALES_DIRECTOR}</p>
          <p>{FOOTER_PHONE}</p>
        </div>
      </div>
      <p className="mt-2 text-center sm:text-right">
        SaaS ERP + PMS Platform · Multi-School Tenant Architecture
      </p>
    </footer>
  );
}
