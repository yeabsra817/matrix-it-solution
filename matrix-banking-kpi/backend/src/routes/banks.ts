import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, withTransaction } from '../db';
import { AuthRequest, authenticate, loadActiveUser, requireRoles } from '../middleware/auth';
import { AppError, handleError, sendSuccess, generateBankCode, logAudit } from '../utils';
import { SUPER_ADMIN_CREATABLE_ROLES } from '../types';

const router = Router();

const createBankSchema = z.object({
  name: z.string().min(2, 'Bank name must be at least 2 characters').max(255),
});

const createBankUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(255),
  password: z.string().min(8).optional(),
  role: z.enum(['DISTRICT_MANAGER', 'DIRECTOR_DEPOSIT_MOBILIZATION']),
  districtId: z.string().uuid().optional(),
});

router.use(authenticate, loadActiveUser, requireRoles('SUPER_ADMIN'));

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query<{
      id: string;
      name: string;
      bank_code: string;
      is_active: boolean;
      created_at: Date;
      user_count: string;
    }>(
      `SELECT b.id, b.name, b.bank_code, b.is_active, b.created_at,
              COUNT(u.id)::text as user_count
       FROM banks b
       LEFT JOIN users u ON u.bank_id = b.id
       GROUP BY b.id
       ORDER BY b.created_at DESC`
    );

    sendSuccess(res, result.rows.map((b) => ({
      id: b.id,
      name: b.name,
      bankCode: b.bank_code,
      isActive: b.is_active,
      createdAt: b.created_at,
      userCount: parseInt(b.user_count, 10),
    })));
  } catch (error) {
    handleError(error, res);
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name } = createBankSchema.parse(req.body);
    const bankCode = generateBankCode();

    const result = await query<{ id: string; name: string; bank_code: string }>(
      `INSERT INTO banks (name, bank_code) VALUES ($1, $2) RETURNING id, name, bank_code`,
      [name, bankCode]
    );

    const bank = result.rows[0];

    await logAudit(null, {
      userId: req.user!.userId,
      action: 'CREATE_BANK',
      entityType: 'bank',
      entityId: bank.id,
      details: { name, bankCode },
    });

    sendSuccess(res, {
      id: bank.id,
      name: bank.name,
      bankCode: bank.bank_code,
      message: `Bank created successfully. Bank Code: ${bank.bank_code}`,
    }, 201);
  } catch (error) {
    handleError(error, res);
  }
});

router.get('/:bankId', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query<{
      id: string;
      name: string;
      bank_code: string;
      is_active: boolean;
      created_at: Date;
    }>('SELECT id, name, bank_code, is_active, created_at FROM banks WHERE id = $1', [req.params.bankId]);

    const bank = result.rows[0];
    if (!bank) throw new AppError(404, 'Bank not found');

    sendSuccess(res, {
      id: bank.id,
      name: bank.name,
      bankCode: bank.bank_code,
      isActive: bank.is_active,
      createdAt: bank.created_at,
    });
  } catch (error) {
    handleError(error, res);
  }
});

router.post('/:bankId/users', async (req: AuthRequest, res: Response) => {
  try {
    const data = createBankUserSchema.parse(req.body);

    if (!SUPER_ADMIN_CREATABLE_ROLES.includes(data.role)) {
      throw new AppError(400, 'Invalid role for super admin creation');
    }

    const bankCheck = await query('SELECT id FROM banks WHERE id = $1', [req.params.bankId]);
    if (!bankCheck.rows[0]) throw new AppError(404, 'Bank not found');

    if (data.role === 'DISTRICT_MANAGER' && !data.districtId) {
      throw new AppError(400, 'District ID is required for District Manager');
    }

    const password = data.password || 'Password123!';
    const hash = await bcrypt.hash(password, 12);

    const result = await query<{ id: string; email: string; full_name: string; role: string }>(
      `INSERT INTO users (bank_id, district_id, email, password_hash, full_name, role, must_change_password, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7)
       RETURNING id, email, full_name, role`,
      [
        req.params.bankId,
        data.districtId || null,
        data.email.toLowerCase(),
        hash,
        data.fullName,
        data.role,
        req.user!.userId,
      ]
    );

    const user = result.rows[0];

    await logAudit(null, {
      bankId: req.params.bankId as string,
      userId: req.user!.userId,
      action: 'CREATE_BANK_USER',
      entityType: 'user',
      entityId: user.id,
      details: { role: data.role, email: data.email },
    });

    sendSuccess(res, {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      temporaryPassword: data.password ? undefined : password,
    }, 201);
  } catch (error) {
    handleError(error, res);
  }
});

router.patch('/:bankId/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query<{ is_active: boolean }>(
      `UPDATE banks SET is_active = NOT is_active WHERE id = $1 RETURNING is_active`,
      [req.params.bankId]
    );

    if (!result.rows[0]) throw new AppError(404, 'Bank not found');

    sendSuccess(res, { isActive: result.rows[0].is_active });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
