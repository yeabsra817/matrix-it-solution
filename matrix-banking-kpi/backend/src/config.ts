import dotenv from 'dotenv';
dotenv.config();

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? '';
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

export const config = {
  port: envInt('PORT', 4000),
  nodeEnv,
  isProduction,
  databaseUrl: isProduction
    ? env('DATABASE_URL')
    : process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/matrix_banking_kpi',
  databaseSsl: process.env.DATABASE_SSL === 'true' || isProduction,
  databasePoolMax: envInt('DATABASE_POOL_MAX', isProduction ? 10 : 20),
  jwtSecret: isProduction
    ? env('JWT_SECRET')
    : process.env.JWT_SECRET || 'matrix-banking-kpi-dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || 'yeabsra45@gmail.com',
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || '227387',
  superAdminName: process.env.SUPER_ADMIN_NAME || 'Yeabsra Teffera',
};
