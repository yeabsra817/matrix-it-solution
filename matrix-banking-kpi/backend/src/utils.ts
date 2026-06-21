import { Response } from 'express';
import { ZodError } from 'zod';
import { PoolClient } from 'pg';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function sendError(res: Response, statusCode: number, message: string) {
  return res.status(statusCode).json({
    success: false,
    error: message,
    message: statusCode >= 500 ? 'Something went wrong, please try again' : message,
  });
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

export function handleError(error: unknown, res: Response) {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return sendError(res, error.statusCode, error.message);
  }

  if (error instanceof ZodError) {
    const message = error.errors.map((e) => e.message).join(', ');
    return sendError(res, 400, message);
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as { code: string; constraint?: string };
    if (pgError.code === '23505') {
      return sendError(res, 409, 'Duplicate entry. This record already exists.');
    }
    if (pgError.code === '23503') {
      return sendError(res, 400, 'Invalid reference. Related record not found.');
    }
  }

  return sendError(res, 500, 'Something went wrong, please try again');
}

export async function logAudit(
  client: PoolClient | null,
  params: {
    bankId?: string | null;
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string;
    details?: Record<string, unknown>;
  }
) {
  const sql = `INSERT INTO audit_logs (bank_id, user_id, action, entity_type, entity_id, details)
               VALUES ($1, $2, $3, $4, $5, $6)`;
  const values = [
    params.bankId ?? null,
    params.userId ?? null,
    params.action,
    params.entityType,
    params.entityId ?? null,
    params.details ? JSON.stringify(params.details) : null,
  ];

  try {
    if (client) {
      await client.query(sql, values);
    } else {
      const { query } = await import('./db');
      await query(sql, values);
    }
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

export function generateBankCode(): string {
  const prefix = 'BNK';
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

export function calcTargets(yearlyTarget: number) {
  return {
    yearly: yearlyTarget,
    quarterly: Math.round((yearlyTarget / 4) * 100) / 100,
    monthly: Math.round((yearlyTarget / 12) * 100) / 100,
    daily: Math.round((yearlyTarget / 365) * 100) / 100,
  };
}

export function calcPerformance(actual: number, target: number): number {
  if (target <= 0) return actual > 0 ? 100 : 0;
  return Math.round((actual / target) * 10000) / 100;
}

export function getKpiFieldForType(kpiType: string): string {
  const map: Record<string, string> = {
    DEPOSIT_MOBILIZATION: 'deposit_amount',
    NEW_ACCOUNTS: 'accounts_opened',
    MOBILE_BANKING: 'mobile_banking_count',
    CARD_BANKING: 'card_banking_count',
    QR_BANKING: 'qr_banking_count',
  };
  return map[kpiType] || 'deposit_amount';
}
