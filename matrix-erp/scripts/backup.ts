import { runDatabaseBackup } from "../src/lib/backup";

async function main() {
  const result = await runDatabaseBackup();
  console.log(`Backup saved: ${result.filePath} (${result.sizeBytes} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
