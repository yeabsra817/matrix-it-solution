import bcrypt from 'bcryptjs';
import { pool, query } from './db';
import { config } from './config';

const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'Password123!';

async function seed() {
  console.log('Seeding database...');
  console.log(`Environment: ${config.nodeEnv}`);

  const superAdminHash = await bcrypt.hash(config.superAdminPassword, 12);
  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // Primary Super Admin (production default)
  await query(
    `INSERT INTO users (email, password_hash, full_name, role, status)
     VALUES ($1, $2, $3, 'SUPER_ADMIN', 'ACTIVE')
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       full_name = EXCLUDED.full_name,
       role = 'SUPER_ADMIN',
       status = 'ACTIVE'`,
    [config.superAdminEmail.toLowerCase(), superAdminHash, config.superAdminName]
  );

  console.log(`Super Admin ready: ${config.superAdminEmail}`);

  // Bank
  const bankResult = await query<{ id: string }>(
    `INSERT INTO banks (name, bank_code)
     VALUES ('Matrix Commercial Bank', 'MCB-2024')
     ON CONFLICT (bank_code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`
  );
  const bankId = bankResult.rows[0]?.id;

  if (!bankId) {
    const existing = await query<{ id: string }>("SELECT id FROM banks WHERE bank_code = 'MCB-2024'");
    if (!existing.rows[0]) {
      console.error('Failed to create bank');
      process.exit(1);
    }
  }

  const finalBankId =
    bankId ||
    (await query<{ id: string }>("SELECT id FROM banks WHERE bank_code = 'MCB-2024'")).rows[0].id;

  const districtResult = await query<{ id: string }>(
    `INSERT INTO districts (bank_id, name, code)
     VALUES ($1, 'Addis Ababa District', 'AA-D01')
     ON CONFLICT (bank_id, code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [finalBankId]
  );
  const districtId = districtResult.rows[0].id;

  const branchResult = await query<{ id: string }>(
    `INSERT INTO branches (bank_id, district_id, name, code)
     VALUES ($1, $2, 'Bole Branch', 'MCB-B01')
     ON CONFLICT (bank_id, code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [finalBankId, districtId]
  );
  const branchId = branchResult.rows[0].id;

  const users = [
    {
      email: 'director@matrixbank.com',
      name: 'Abebe Director',
      role: 'DIRECTOR_DEPOSIT_MOBILIZATION',
      districtId: null,
      branchId: null,
    },
    {
      email: 'district@matrixbank.com',
      name: 'Sara District Manager',
      role: 'DISTRICT_MANAGER',
      districtId,
      branchId: null,
    },
    {
      email: 'branch@matrixbank.com',
      name: 'Kebede Branch Manager',
      role: 'BRANCH_MANAGER',
      districtId,
      branchId,
    },
    {
      email: 'cso@matrixbank.com',
      name: 'Tigist CSO',
      role: 'CUSTOMER_SERVICE_OFFICER',
      districtId,
      branchId,
    },
    {
      email: 'cashier@matrixbank.com',
      name: 'Dawit Cashier',
      role: 'CASHIER',
      districtId,
      branchId,
    },
  ];

  for (const u of users) {
    await query(
      `INSERT INTO users (bank_id, district_id, branch_id, email, password_hash, full_name, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
       ON CONFLICT (email) DO NOTHING`,
      [finalBankId, u.districtId, u.branchId, u.email, demoHash, u.name, u.role]
    );
  }

  const branchManager = await query<{ id: string }>(
    "SELECT id FROM users WHERE email = 'branch@matrixbank.com'"
  );
  const bmId = branchManager.rows[0]?.id;
  const year = new Date().getFullYear();

  if (bmId) {
    const targets = [
      { type: 'DEPOSIT_MOBILIZATION', yearly: 12000000 },
      { type: 'NEW_ACCOUNTS', yearly: 1200 },
      { type: 'MOBILE_BANKING', yearly: 600 },
      { type: 'CARD_BANKING', yearly: 400 },
      { type: 'QR_BANKING', yearly: 300 },
    ];

    for (const t of targets) {
      await query(
        `INSERT INTO kpi_targets (bank_id, branch_id, year, kpi_type, yearly_target, quarterly_target, monthly_target, daily_target, set_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (branch_id, year, kpi_type) DO NOTHING`,
        [
          finalBankId,
          branchId,
          year,
          t.type,
          t.yearly,
          t.yearly / 4,
          t.yearly / 12,
          t.yearly / 365,
          bmId,
        ]
      );
    }
  }

  console.log('\n=== Seed Complete ===');
  console.log(`Super Admin: ${config.superAdminEmail}`);
  console.log(`Demo users password: ${DEMO_PASSWORD}`);
  console.log('  Director:       director@matrixbank.com');
  console.log('  District Mgr:   district@matrixbank.com');
  console.log('  Branch Mgr:     branch@matrixbank.com');
  console.log('  CSO:            cso@matrixbank.com');
  console.log('  Cashier:        cashier@matrixbank.com');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
