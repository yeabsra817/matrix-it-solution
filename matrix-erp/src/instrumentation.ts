export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initializeSystemRegistry } = await import("./lib/system-registry");
    initializeSystemRegistry();
    const { ensureDefaultSuperAdmins } = await import("./lib/ensure-super-admin");
    await ensureDefaultSuperAdmins().catch((err) =>
      console.warn("[instrumentation] ensure super admin:", err)
    );
  }
}
