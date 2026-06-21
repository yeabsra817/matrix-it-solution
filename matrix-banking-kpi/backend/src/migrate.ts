import fs from 'fs';
import path from 'path';
import { pool } from './db';

async function migrate() {
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  console.log('Running database migration...');
  await pool.query(schema);
  console.log('Migration completed successfully.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
