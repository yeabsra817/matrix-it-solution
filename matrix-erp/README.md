# MATRIX IT SOLUTION — Multi-School ERP + PMS

**Developed by Yeabsra Teffera**

Production-ready SaaS MVP with isolated tenant databases, full audit trail, PMS analytics, KPI engine, budget module, notifications, and cloud deployment support.

## Quick start

```bash
cd matrix-erp
npm install
npm run db:push
npm run seed
npm run dev
```

Open http://localhost:3000

## Login (seeded)

| Role | School Code | Email | Password |
|------|-------------|-------|----------|
| Super Admin | ROOT | yeabsra45@gmail.com | 227387 |
| Director | 001 | director@001.edu | 1234 |
| HR | 001 | hr@001.edu | 1234 |
| Accountant | 001 | accountant@001.edu | 1234 |

## Features (Sections 43–63)

| # | Feature |
|---|---------|
| 43 | HR certificate PDF with name, role, experience, school, HR + Director signatures, official stamp |
| 44 | Director role requests → Super Admin approve/reject |
| 45–48 | School autonomy, global disable, bcrypt passwords, login tracking, per-school DB |
| 49 | Indexed queries for fast reads |
| 50 | Vercel-ready (`vercel.json`, cron backup) |
| 51 | Notification engine (system + role alerts) |
| 52 | PMS analytics ranking & scoring |
| 53 | Weighted KPI engine |
| 54 | Financial/budget module per school |
| 55 | All APIs and pages wired — no 404s |
| 56 | Auto backup (`npm run backup` + cron API) |
| 57 | Full audit trail + login logs |
| 58 | Mobile responsive UI |
| 59–60 | SaaS multi-tenant, unlimited schools |
| 61 | New roles require Super Admin approval |
| 62 | System credit in UI footer |
| 63 | **Reports & Insights Hub** (Director) |

## Deploy to Vercel

1. Push repo to GitHub
2. Import in Vercel
3. Set environment variables:
   - `DATABASE_URL` — use [Turso](https://turso.tech) or Postgres for production (SQLite files are dev-only on serverless)
   - `SESSION_SECRET`
   - `BACKUP_CRON_SECRET`
   - `SCHOOL_DB_URL` — required for Prisma generate
4. Deploy — daily backup cron calls `/api/system/backup`

For local production test: `npm run build && npm start`

## Scripts

- `npm run seed` — seed super admin + demo schools
- `npm run backup` — backup all tenant databases
- `npm run setup` — push schema + seed
