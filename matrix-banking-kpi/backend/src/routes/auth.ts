import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../db';
import { config } from '../config';
import { AuthRequest, authenticate, loadActiveUser } from '../middleware/auth';
import { AppError, handleError, sendSuccess, logAudit } from '../utils';
import { JwtPayload } from '../types';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

router.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const result = await query<{
      id: string;
      email: string;
      password_hash: string;
      full_name: string;
      role: string;
      status: string;
      bank_id: string | null;
      district_id: string | null;
      branch_id: string | null;
      must_change_password: boolean;
    }>(
      `SELECT id, email, password_hash, full_name, role, status, bank_id, district_id, branch_id, must_change_password
       FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    if (user.status === 'BLOCKED') {
      throw new AppError(403, 'Your account has been blocked. Contact your administrator.');
    }
    if (user.status === 'INACTIVE') {
      throw new AppError(403, 'Your account is inactive. Contact your administrator.');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError(401, 'Invalid email or password');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as JwtPayload['role'],
      bankId: user.bank_id,
      districtId: user.district_id,
      branchId: user.branch_id,
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] });

    let bankName = null;
    if (user.bank_id) {
      const bankResult = await query<{ name: string }>(
        'SELECT name FROM banks WHERE id = $1',
        [user.bank_id]
      );
      bankName = bankResult.rows[0]?.name ?? null;
    }

    await logAudit(null, {
      bankId: user.bank_id,
      userId: user.id,
      action: 'LOGIN',
      entityType: 'user',
      entityId: user.id,
    });

    sendSuccess(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        bankId: user.bank_id,
        districtId: user.district_id,
        branchId: user.branch_id,
        bankName,
        mustChangePassword: user.must_change_password,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
});

router.get('/me', authenticate, loadActiveUser, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query<{
      id: string;
      email: string;
      full_name: string;
      role: string;
      status: string;
      bank_id: string | null;
      district_id: string | null;
      branch_id: string | null;
      must_change_password: boolean;
    }>(
      `SELECT id, email, full_name, role, status, bank_id, district_id, branch_id, must_change_password
       FROM users WHERE id = $1`,
      [req.user!.userId]
    );

    const user = result.rows[0];
    if (!user) throw new AppError(404, 'User not found');

    let bankName = null;
    let branchName = null;
    let districtName = null;

    if (user.bank_id) {
      const bankResult = await query<{ name: string }>('SELECT name FROM banks WHERE id = $1', [user.bank_id]);
      bankName = bankResult.rows[0]?.name;
    }
    if (user.branch_id) {
      const branchResult = await query<{ name: string }>('SELECT name FROM branches WHERE id = $1', [user.branch_id]);
      branchName = branchResult.rows[0]?.name;
    }
    if (user.district_id) {
      const districtResult = await query<{ name: string }>('SELECT name FROM districts WHERE id = $1', [user.district_id]);
      districtName = districtResult.rows[0]?.name;
    }

    sendSuccess(res, {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      status: user.status,
      bankId: user.bank_id,
      districtId: user.district_id,
      branchId: user.branch_id,
      bankName,
      branchName,
      districtName,
      mustChangePassword: user.must_change_password,
    });
  } catch (error) {
    handleError(error, res);
  }
});

router.post('/change-password', authenticate, loadActiveUser, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const result = await query<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user!.userId]
    );

    const user = result.rows[0];
    if (!user) throw new AppError(404, 'User not found');

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw new AppError(400, 'Current password is incorrect');

    const hash = await bcrypt.hash(newPassword, 12);
    await query(
      'UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2',
      [hash, req.user!.userId]
    );

    sendSuccess(res, { message: 'Password changed successfully' });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
