import { makeRoleLayout } from "@/lib/role-pages";

export default makeRoleLayout("RECEPTIONIST", [
  { href: "/dashboard/receptionist", label: "Front Desk" },
  { href: "/dashboard/receptionist/settings", label: "Settings" },
]);
