# Matrix Modern Banking KPI Tracker

**Developed by Yeabsra Teffera – Professional Banker**

A production-ready multi-tenant SaaS application for tracking banking KPIs across banks, districts, branches, and staff.

## Features

- **Multi-tenant SaaS** – Multiple banks with strict data isolation
- **Role-Based Access Control** – 9 roles with strict permissions
- **KPI Target Setting** – Yearly targets auto-broken into quarterly, monthly, daily
- **Target Cascading** – Branch managers assign targets to staff
- **Daily Performance Entry** – With duplicate account prevention
- **Approval Workflow** – Branch manager approves/rejects entries
- **Performance Dashboards** – Staff, Branch, District, Director views
- **Reports** – Export to PDF & Excel
- **Real-time Updates** – Auto-refresh dashboards every 30 seconds
- **Yellow Banking UI** – Modern professional design

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT + RBAC |
| Charts | Recharts |
| Export | jsPDF + xlsx |

## Project Structure

```
matrix-banking-kpi/
├── backend/          # Express API server
├── frontend/         # Next.js 14 application
├── database/         # SQL schema & seed data
├── DEPLOYMENT.md     # Deployment guide
└── README.md
```

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 1. Database Setup

```bash
createdb matrix_banking_kpi
psql -d matrix_banking_kpi -f database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

API runs at `http://localhost:4000`

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App runs at `http://localhost:3000`

## Demo Accounts

All passwords: `Password123!`

| Role | Email |
|------|-------|
| Super Admin | superadmin@matrixbanking.com |
| Director | director@matrixbank.com |
| District Manager | district@matrixbank.com |
| Branch Manager | branch@matrixbank.com |
| CSO | cso@matrixbank.com |
| Cashier | cashier@matrixbank.com |

## Roles & Permissions

| Role | Capabilities |
|------|-------------|
| Super Admin | Create banks, generate bank codes, create directors & district managers. **Cannot view performance data** |
| Director | Bank-wide performance overview |
| District Manager | District branch comparison, create staff & branches |
| Branch Manager | Set targets, assign KPIs, approve entries, manage staff |
| Staff (CSM, CSO, Cashier, etc.) | Daily entry, personal KPI dashboard |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| GET/POST | /api/banks | Bank management (Super Admin) |
| GET/POST | /api/organization/* | Districts & branches |
| GET/POST/PATCH | /api/users | User management |
| GET/POST | /api/kpi/targets | KPI target setting |
| GET/POST | /api/kpi/assignments | Staff KPI assignments |
| GET/POST | /api/entries | Daily performance entries |
| POST | /api/entries/:id/approve | Approve/reject entries |
| GET | /api/dashboard/* | Role-based dashboards |
| GET | /api/reports | Filtered reports |

## Security

- JWT authentication with role-based middleware
- Bank-level data isolation (no cross-bank access)
- Super Admin blocked from performance endpoints
- Duplicate account number prevention
- Input validation with Zod on all endpoints
- User-friendly error messages (no crash errors)

## Deployment

- **Vercel (Frontend)**: See [VERCEL.md](./VERCEL.md) for step-by-step instructions
- **Full stack**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

### Super Admin (production seed)

| Email | Password |
|-------|----------|
| yeabsra45@gmail.com | 227387 |

Run `npm run seed` after deploying the database.
