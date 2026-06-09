export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initializeSystemRegistry } = await import("./lib/system-registry");
    initializeSystemRegistry();
  }
}
