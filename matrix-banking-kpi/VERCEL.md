# Deploy on Vercel — Matrix Modern Banking KPI Tracker

**Developed by Yeabsra Teffera – Professional Banker**

This app uses a **split deployment**:
- **Frontend (Next.js)** → Vercel
- **Backend (Express API)** → Railway or Render
- **Database (PostgreSQL)** → Supabase, Railway Postgres, or Neon

---

## Architecture

```
User → Vercel (Next.js) → /api/* rewrites → Railway (Express) → Supabase (PostgreSQL)
```

The frontend never hardcodes `localhost`. In production, API calls go to `/api/...` on your Vercel domain and are proxied to the backend via `API_URL`.

---

## Step 1: Database (Supabase)

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** → paste and run `database/schema.sql`
3. Copy the **Connection string** (Transaction pooler, port 6543):
   ```
   postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

---

## Step 2: Backend (Railway)

1. Go to [railway.app](https://railway.app) → **New Project** → Deploy from GitHub
2. Set **Root Directory**: `matrix-banking-kpi/backend`
3. Add environment variables:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `DATABASE_URL` | Your Supabase connection string |
| `DATABASE_SSL` | `true` |
| `JWT_SECRET` | Strong random string (32+ chars) |
| `JWT_EXPIRES_IN` | `24h` |
| `CORS_ORIGIN` | `https://YOUR-APP.vercel.app` |
| `FRONTEND_URL` | `https://YOUR-APP.vercel.app` |
| `SUPER_ADMIN_EMAIL` | `yeabsra45@gmail.com` |
| `SUPER_ADMIN_PASSWORD` | `227387` |
| `SUPER_ADMIN_NAME` | `Yeabsra Teffera` |

4. Deploy → copy your public URL, e.g. `https://matrix-kpi-api.up.railway.app`

5. **Seed the database** (Railway shell or locally with production `DATABASE_URL`):
   ```bash
   cd backend
   npm run seed
   ```

6. Verify: `https://YOUR-API-URL/api/health` → `"database": "connected"`

---

## Step 3: Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
2. Configure:

| Setting | Value |
|---------|-------|
| **Root Directory** | `matrix-banking-kpi/frontend` |
| **Framework** | Next.js (auto-detected) |
| **Build Command** | `npm run build` |
| **Install Command** | `npm install` |

3. Add environment variable:

| Variable | Value |
|----------|-------|
| `API_URL` | `https://YOUR-API-URL.up.railway.app` |

> Do **NOT** set `NEXT_PUBLIC_API_URL` in production — the app uses same-origin `/api` proxy.

4. Click **Deploy**

---

## Step 4: Link Backend CORS to Vercel URL

After Vercel deploys, update Railway env vars:

```
CORS_ORIGIN=https://your-actual-app.vercel.app
FRONTEND_URL=https://your-actual-app.vercel.app
```

Redeploy the backend if needed.

---

## Step 5: Login

| Field | Value |
|-------|-------|
| Email | `yeabsra45@gmail.com` |
| Password | `227387` |
| Role | Super Admin |

---

## Local Development

```bash
# 1. Database
createdb matrix_banking_kpi
psql -d matrix_banking_kpi -f database/schema.sql

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

---

## Environment Variables Reference

See `.env.example` at the project root for the full list.

### Vercel (frontend only)

| Variable | Required | Description |
|----------|----------|-------------|
| `API_URL` | Yes | Express backend URL for rewrites |

### Railway (backend)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | JWT signing secret |
| `CORS_ORIGIN` | Yes | Vercel app URL |
| `SUPER_ADMIN_EMAIL` | No | Default: yeabsra45@gmail.com |
| `SUPER_ADMIN_PASSWORD` | No | Default: 227387 |

---

## Build Verification

```bash
# From project root (Vercel uses this)
npm run build

# Full stack
npm run build:all
```

Both should complete with no TypeScript errors.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| API calls fail on Vercel | Set `API_URL` to your Railway backend URL |
| CORS error | Update `CORS_ORIGIN` on backend to match Vercel URL exactly |
| Database disconnected | Check `DATABASE_URL` and `DATABASE_SSL=true` |
| Login fails | Run `npm run seed` on backend with production DB |
| 404 on /api/* | Ensure backend is running and `API_URL` has no trailing slash |

---

## Production Checklist

- [ ] `database/schema.sql` applied to Supabase
- [ ] `npm run seed` executed on production database
- [ ] `JWT_SECRET` is a strong unique value
- [ ] `CORS_ORIGIN` matches Vercel production URL
- [ ] `API_URL` set on Vercel pointing to Railway
- [ ] Health check passes: `/api/health`
- [ ] Super Admin login works
