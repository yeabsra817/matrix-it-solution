import { makeRoleLayout } from "@/lib/role-pages";

export default makeRoleLayout("TRANSPORT_OFFICER", [
  { href: "/dashboard/transport-officer", label: "Transport" },
  { href: "/dashboard/transport-officer/settings", label: "Settings" },
]);
