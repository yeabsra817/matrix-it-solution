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

1. Push repo to GitHub (root folder must be `matrix-erp`)
2. Import in Vercel
3. Set environment variables:
   - `SESSION_SECRET` — long random string (required)
   - `SUPER_ADMIN_VERIFY_CODE` — Super Admin verification code (default: `227387`)
   - `DATABASE_URL` — optional for persistent production; use [Turso](https://turso.tech) `libsql://...` for multi-tenant scale. If omitted, bundled seed DBs from `prisma/seed/` are used at build time.
   - `BACKUP_CRON_SECRET` — for daily backup cron
4. Deploy — build runs `vercel-build` which bundles `prisma/seed/master.db` with Super Admin credentials.

### Super Admin login (production)

| Field | Value |
|-------|-------|
| School code | `ROOT` |
| Email | `yeabsra45@gmail.com` |
| Password | `227387` |
| Verification code | `227387` (or your `SUPER_ADMIN_VERIFY_CODE`) |

### Vercel environment variables (required)

| Variable | Example | Purpose |
|----------|---------|---------|
| `SESSION_SECRET` | long random string | JWT session signing |
| `SUPER_ADMIN_VERIFY_CODE` | `227387` | Super Admin login verification |
| `NEXT_PUBLIC_API_URL` | *(leave empty)* | Same-origin on Vercel; set only if API is on another domain |
| `NEXT_PUBLIC_BASE_URL` | `https://your-app.vercel.app` | Optional canonical URL |

Login uses bundled demo databases from `prisma/seed/` when cloud DB is unavailable. Demo fallback credentials are always available for investor demos.

For local production test: `npm run build && npm start`

## Scripts

- `npm run seed` — seed super admin + demo schools
- `npm run backup` — backup all tenant databases
- `npm run setup` — push schema + seed
