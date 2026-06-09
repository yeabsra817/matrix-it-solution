import { makeRoleLayout } from "@/lib/role-pages";

export default makeRoleLayout("SECURITY", [
  { href: "/dashboard/security", label: "Security" },
  { href: "/dashboard/security/settings", label: "Settings" },
]);
