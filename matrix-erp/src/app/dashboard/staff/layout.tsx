import { makeRoleLayout } from "@/lib/role-pages";

export default makeRoleLayout("STAFF", [
  { href: "/dashboard/staff", label: "Overview" },
  { href: "/dashboard/staff/settings", label: "Settings" },
]);
