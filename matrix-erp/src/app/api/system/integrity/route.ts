import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import {
  getRegistrySnapshot,
  RULE_PRIORITY,
} from "@/lib/duplicate-guard";
import {
  getCanonicalModuleList,
  initializeSystemRegistry,
} from "@/lib/system-registry";
import { ROLES } from "@/lib/constants";
import { STAFF_ROLES } from "@/lib/staff-roles";

export async function GET() {
  const { session, response } = await requirePermission("createSchool");
  if (response) return response;

  const registry = initializeSystemRegistry();

  const roleIds = [...new Set(ROLES)];
  const staffIds = [...new Set(STAFF_ROLES.map((r) => String(r)))];

  return NextResponse.json({
    ok: true,
    rulePriority: RULE_PRIORITY,
    policy: {
      onDuplicate: "keep_original_ignore_duplicate",
      onConflict: "priority_order_then_preserve_security",
      neverBreak: ["authentication", "school_isolation"],
    },
    registry: getRegistrySnapshot(),
    registryInit: registry,
    canonicalModules: getCanonicalModuleList(),
    roles: {
      total: roleIds.length,
      unique: roleIds.length === ROLES.length,
      duplicates: ROLES.length - roleIds.length,
    },
    staffRoles: {
      total: staffIds.length,
      unique: staffIds.length === STAFF_ROLES.length,
    },
    checkedAt: new Date().toISOString(),
  });
}
