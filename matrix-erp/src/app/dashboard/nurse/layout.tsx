import { makeRoleLayout } from "@/lib/role-pages";

export default makeRoleLayout("NURSE", [
  { href: "/dashboard/nurse", label: "Health" },
  { href: "/dashboard/nurse/settings", label: "Settings" },
]);
