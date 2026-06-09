import fs from "fs";
import path from "path";
import { masterDb } from "./master-db";

export async function runDatabaseBackup(): Promise<{
  filePath: string;
  sizeBytes: number;
}> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups", timestamp);
  fs.mkdirSync(backupDir, { recursive: true });

  const masterSrc = path.join(process.cwd(), "data", "master.db");
  if (fs.existsSync(masterSrc)) {
    fs.copyFileSync(masterSrc, path.join(backupDir, "master.db"));
  }

  const schoolsDir = path.join(process.cwd(), "data", "schools");
  if (fs.existsSync(schoolsDir)) {
    const schoolBackupDir = path.join(backupDir, "schools");
    fs.mkdirSync(schoolBackupDir, { recursive: true });
    for (const file of fs.readdirSync(schoolsDir)) {
      if (file.endsWith(".db")) {
        fs.copyFileSync(
          path.join(schoolsDir, file),
          path.join(schoolBackupDir, file)
        );
      }
    }
  }

  const sizeBytes = dirSize(backupDir);
  const filePath = backupDir;

  await masterDb.backupLog.create({
    data: { filePath, sizeBytes, status: "SUCCESS" },
  });

  return { filePath, sizeBytes };
}

function dirSize(dir: string): number {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += dirSize(full);
    else total += fs.statSync(full).size;
  }
  return total;
}
