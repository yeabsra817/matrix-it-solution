-- Matrix Modern Banking KPI Tracker
-- PostgreSQL Schema - Production Ready
-- Developed by Yeabsra Teffera

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Roles enum
CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'DIRECTOR_DEPOSIT_MOBILIZATION',
  'DISTRICT_MANAGER',
  'BRANCH_MANAGER',
  'CUSTOMER_SERVICE_MANAGER',
  'CUSTOMER_SERVICE_OFFICER',
  'CASHIER',
  'CONTROLLER',
  'CREDIT_RELATIONSHIP_MANAGER'
);

CREATE TYPE kpi_type AS ENUM (
  'DEPOSIT_MOBILIZATION',
  'NEW_ACCOUNTS',
  'MOBILE_BANKING',
  'CARD_BANKING',
  'QR_BANKING'
);

CREATE TYPE entry_status AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE user_status AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'BLOCKED'
);

-- Banks (multi-tenant root)
CREATE TABLE banks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  bank_code VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_banks_code ON banks(bank_code);

-- Districts
CREATE TABLE districts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(bank_id, code)
);

CREATE INDEX idx_districts_bank ON districts(bank_id);

-- Branches
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(bank_id, code)
);

CREATE INDEX idx_branches_bank ON branches(bank_id);
CREATE INDEX idx_branches_district ON branches(district_id);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_id UUID REFERENCES banks(id) ON DELETE CASCADE,
  district_id UUID REFERENCES districts(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  status user_status NOT NULL DEFAULT 'ACTIVE',
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT super_admin_no_bank CHECK (
    (role = 'SUPER_ADMIN' AND bank_id IS NULL) OR
    (role != 'SUPER_ADMIN' AND bank_id IS NOT NULL)
  )
);

CREATE INDEX idx_users_bank ON users(bank_id);
CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- KPI Targets (yearly with auto breakdown stored)
CREATE TABLE kpi_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  kpi_type kpi_type NOT NULL,
  yearly_target DECIMAL(18,2) NOT NULL CHECK (yearly_target >= 0),
  quarterly_target DECIMAL(18,2) NOT NULL CHECK (quarterly_target >= 0),
  monthly_target DECIMAL(18,2) NOT NULL CHECK (monthly_target >= 0),
  daily_target DECIMAL(18,2) NOT NULL CHECK (daily_target >= 0),
  set_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(branch_id, year, kpi_type)
);

CREATE INDEX idx_kpi_targets_branch_year ON kpi_targets(branch_id, year);

-- KPI Assignments (staff allocation from branch targets)
CREATE TABLE kpi_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kpi_target_id UUID NOT NULL REFERENCES kpi_targets(id) ON DELETE CASCADE,
  yearly_allocation DECIMAL(18,2) NOT NULL CHECK (yearly_allocation >= 0),
  quarterly_allocation DECIMAL(18,2) NOT NULL CHECK (quarterly_allocation >= 0),
  monthly_allocation DECIMAL(18,2) NOT NULL CHECK (monthly_allocation >= 0),
  daily_allocation DECIMAL(18,2) NOT NULL CHECK (daily_allocation >= 0),
  assigned_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, kpi_target_id)
);

CREATE INDEX idx_kpi_assignments_user ON kpi_assignments(user_id);
CREATE INDEX idx_kpi_assignments_branch ON kpi_assignments(branch_id);

-- KPI Entries (daily performance)
CREATE TABLE kpi_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  accounts_opened INTEGER NOT NULL DEFAULT 0 CHECK (accounts_opened >= 0),
  deposit_amount DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  mobile_banking_count INTEGER NOT NULL DEFAULT 0 CHECK (mobile_banking_count >= 0),
  card_banking_count INTEGER NOT NULL DEFAULT 0 CHECK (card_banking_count >= 0),
  qr_banking_count INTEGER NOT NULL DEFAULT 0 CHECK (qr_banking_count >= 0),
  status entry_status NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

CREATE INDEX idx_kpi_entries_user_date ON kpi_entries(user_id, entry_date);
CREATE INDEX idx_kpi_entries_branch_date ON kpi_entries(branch_id, entry_date);
CREATE INDEX idx_kpi_entries_status ON kpi_entries(status);

-- Account numbers tracked to prevent duplicates
CREATE TABLE account_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
  account_number VARCHAR(50) NOT NULL,
  kpi_entry_id UUID NOT NULL REFERENCES kpi_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(bank_id, account_number)
);

CREATE INDEX idx_account_entries_bank ON account_entries(bank_id);

-- Approvals
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kpi_entry_id UUID NOT NULL REFERENCES kpi_entries(id) ON DELETE CASCADE UNIQUE,
  approved_by UUID NOT NULL REFERENCES users(id),
  status entry_status NOT NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approvals_entry ON approvals(kpi_entry_id);

-- Audit log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_id UUID REFERENCES banks(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_bank ON audit_logs(bank_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER banks_updated_at BEFORE UPDATE ON banks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER districts_updated_at BEFORE UPDATE ON districts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER kpi_targets_updated_at BEFORE UPDATE ON kpi_targets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER kpi_assignments_updated_at BEFORE UPDATE ON kpi_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER kpi_entries_updated_at BEFORE UPDATE ON kpi_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
