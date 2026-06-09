import { spawn } from "child_process";
import { execSync } from "child_process";
import { ensureAppReady } from "./ensure-ready";

const PORT = 3000;
const LOGIN_URL = `http://localhost:${PORT}/login`;

function freePort(port: number) {
  if (process.platform === "win32") {
    try {
      execSync(
        `powershell -NoProfile -Command "$p = Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($id in $p) { if ($id -gt 0) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue } }"`,
        { stdio: "pipe" }
      );
    } catch {
      /* port already free */
    }
    return;
  }
  try {
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, { stdio: "pipe" });
  } catch {
    /* ignore */
  }
}

async function main() {
  console.log("\n[MATRIX] Preparing application...\n");
  await ensureAppReady();
  freePort(PORT);

  console.log("========================================");
  console.log("  MATRIX IT SOLUTION — School ERP");
  console.log("========================================");
  console.log(`  Open in browser: ${LOGIN_URL}`);
  console.log("  Demo login (school code 001):");
  console.log("    director@001.edu  /  1234");
  console.log("    admin@001.edu     /  1234");
  console.log("    teacher@001.edu   /  1234");
  console.log("    student@001.edu   /  1234");
  console.log("  Super Admin (school code ROOT):");
  console.log("    yeabsra45@gmail.com  /  227387");
  console.log("========================================");
  console.log("  Keep this window OPEN while using the app.");
  console.log("  Press Ctrl+C to stop the server.\n");

  const child = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT) },
  });

  child.on("exit", (code) => process.exit(code ?? 0));
  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
}

main().catch((err) => {
  console.error("[MATRIX] Failed to start:", err);
  process.exit(1);
});
