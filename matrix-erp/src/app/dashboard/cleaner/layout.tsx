import { makeRoleLayout } from "@/lib/role-pages";

export default makeRoleLayout("CLEANER", [
  { href: "/dashboard/cleaner", label: "Cleaning" },
  { href: "/dashboard/cleaner/settings", label: "Settings" },
]);
