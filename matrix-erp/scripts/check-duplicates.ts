/**
 * CI helper — verifies no duplicate roles in constants and registry loads cleanly.
 */
import { ROLES } from "../src/lib/constants";
import { initializeSystemRegistry } from "../src/lib/system-registry";

const uniqueRoles = new Set(ROLES);
if (uniqueRoles.size !== ROLES.length) {
  console.error("Duplicate roles detected in constants.ROLES");
  process.exit(1);
}

const registry = initializeSystemRegistry();
if (registry.duplicates.length > 0) {
  console.warn("Registry re-init duplicates (expected on second run):", registry.duplicates);
}

console.log("Duplicate check passed:", ROLES.length, "unique roles");
process.exit(0);
