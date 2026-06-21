# Deployment Guide – Matrix Modern Banking KPI Tracker

**Developed by Yeabsra Teffera – Professional Banker**

This guide covers deploying the full stack to production:
- **Frontend** → Vercel
- **Backend API** → Railway
- **Database** → Supabase (PostgreSQL)

---

## Architecture

```
┌─────────────┐     HTTPS      ┌──────────────┐     HTTPS     ┌──────────────┐
│   Vercel    │ ──────────────▶│   Railway    │──────────────▶│   Supabase   │
│  (Next.js)  │                │  (Express)   │               │ (PostgreSQL) │
└─────────────┘                └──────────────┘               └──────────────┘
```

---

## Step 1: Supabase Database

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database** and copy the connection string:
   ```
   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
3. Open **SQL Editor** and run the contents of `database/schema.sql`
4. (Optional) Run seed via backend: `npm run seed`

---

## Step 2: Railway Backend

1. Create a project at [railway.app](https://railway.app)
2. Connect your GitHub repo (or deploy from `backend/` folder)
3. Set **Root Directory** to `matrix-banking-kpi/backend`
4. Set environment variables:

| Variable | Value |
|----------|-------|
| `PORT` | `4000` |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your Supabase connection string |
| `JWT_SECRET` | Strong random secret (32+ chars) |
| `JWT_EXPIRES_IN` | `24h` |
| `CORS_ORIGIN` | `https://your-app.vercel.app` |
| `FRONTEND_URL` | `https://your-app.vercel.app` |

5. Build command: `npm run build`
6. Start command: `npm start`
7. Copy your Railway public URL (e.g. `https://matrix-kpi-api.up.railway.app`)

### Post-deploy: Seed database

In Railway shell or locally with production DATABASE_URL:
```bash
npm run seed
```

---

## Step 3: Vercel Frontend

1. Import project at [vercel.com](https://vercel.com)
2. Set **Root Directory** to `matrix-banking-kpi/frontend`
3. Framework Preset: **Next.js**
4. Set environment variable:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Your Railway API URL |

5. Deploy

---

## Step 4: Verify Deployment

1. Visit your Vercel URL → should redirect to login
2. Login with `superadmin@matrixbanking.com` / `Password123!`
3. Check API health: `https://your-api.railway.app/api/health`
4. Create a test bank and verify bank code generation

---

## Environment Variables Summary

### Backend (.env)
```env
PORT=4000
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=your-strong-secret-here
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-api.railway.app
```

---

## SSL & CORS

- Railway and Vercel provide HTTPS automatically
- Backend CORS is configured via `CORS_ORIGIN` env var
- Supabase connection uses SSL in production (`rejectUnauthorized: false`)

---

## Custom Domain (Optional)

### Vercel
1. Go to Project Settings → Domains
2. Add your domain (e.g. `kpi.matrixbank.com`)
3. Update DNS records as instructed

### Railway
1. Go to Service Settings → Networking → Custom Domain
2. Add domain (e.g. `api.kpi.matrixbank.com`)

Update `CORS_ORIGIN` and `NEXT_PUBLIC_API_URL` accordingly.

---

## Monitoring & Maintenance

- **Health check**: `GET /api/health` returns database status
- **Logs**: Railway dashboard → Deployments → Logs
- **Database backups**: Enable daily backups in Supabase
- **JWT rotation**: Update `JWT_SECRET` and redeploy (invalidates existing sessions)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Verify `CORS_ORIGIN` matches exact Vercel URL |
| Database connection failed | Check Supabase connection string, enable pooler |
| 401 on all requests | Verify `JWT_SECRET` is set and consistent |
| Login works locally but not prod | Check `NEXT_PUBLIC_API_URL` in Vercel |
| Super Admin sees performance data | Should not happen – verify middleware is deployed |

---

## Production Checklist

- [ ] Change all default passwords after first login
- [ ] Set strong `JWT_SECRET`
- [ ] Enable Supabase daily backups
- [ ] Configure custom domains
- [ ] Test all 9 roles end-to-end
- [ ] Verify Super Admin cannot access `/api/dashboard/*`
- [ ] Test PDF/Excel export
- [ ] Test duplicate account prevention

---

**Support**: Matrix IT Solution – Yeabsra Teffera
