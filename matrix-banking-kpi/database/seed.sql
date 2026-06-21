-- Sample seed data for Matrix Modern Banking KPI Tracker
-- Password for all users: Password123!
-- bcrypt hash of Password123!

-- Note: Run after schema.sql. Super admin created via backend seed script with proper hashing.

-- Sample bank
INSERT INTO banks (id, name, bank_code, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Matrix Commercial Bank', 'MCB-2024', true),
  ('a0000000-0000-0000-0000-000000000002', 'Unity Savings Bank', 'USB-2024', true);

-- Districts
INSERT INTO districts (id, bank_id, name, code) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Addis Ababa District', 'AA-D01'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Oromia District', 'OR-D01');

-- Branches
INSERT INTO branches (id, bank_id, district_id, name, code) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Bole Branch', 'MCB-B01'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Piassa Branch', 'MCB-B02'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Adama Branch', 'MCB-B03');
