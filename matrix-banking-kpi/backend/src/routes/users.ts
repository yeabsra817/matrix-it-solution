import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../db';
import { AuthRequest, authenticate, loadActiveUser, requireRoles } from '../middleware/auth';
import {
  AppError,
  handleError,
  sendSuccess,
  logAudit,
} from '../utils';
import {
  BRANCH_ASSIGNABLE_ROLES,
  DISTRICT_ASSIGNABLE_ROLES,
  USER_CREATOR_ROLES,
  UserRole,
} from '../types';

const router = Router();

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(255),
  role: z.string(),
  branchId: z.string().uuid().optional(),
  districtId: z.string().uuid().optional(),
  password: z.string().min(8).optional(),
});

const updateUserSchema = z.object({
  fullName: z.string().min(2).max(255).optional(),
  role: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional(),
  branchId: z.string().uuid().optional(),
  districtId: z.string().uuid().optional(),
});

router.use(authenticate, loadActiveUser);

function getAssignableRoles(creatorRole: UserRole): UserRole[] {
  if (creatorRole === 'DISTRICT_MANAGER') return DISTRICT_ASSIGNABLE_ROLES;
  if (creatorRole === 'BRANCH_MANAGER') return BRANCH_ASSIGNABLE_ROLES;
  return [];
}

router.get('/', requireRoles(...USER_CREATOR_ROLES, 'DIRECTOR_DEPOSIT_MOBILIZATION'), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    let sql = `SELECT u.id, u.email, u.full_name, u.role, u.status, u.branch_id, u.district_id,
                      u.created_at, b.name as branch_name, d.name as district_name
               FROM users u
               LEFT JOIN branches b ON b.id = u.branch_id
               LEFT JOIN districts d ON d.id = u.district_id
               WHERE u.bank_id = $1 AND u.role != 'SUPER_ADMIN'`;
    const params: unknown[] = [user.bankId];

    if (user.role === 'BRANCH_MANAGER') {
      sql += ' AND u.branch_id = $2';
      params.push(user.branchId);
    } else if (user.role === 'DISTRICT_MANAGER') {
      sql += ' AND u.district_id = $2';
      params.push(user.districtId);
    }

    if (req.query.status) {
      sql += ` AND u.status = $${params.length + 1}`;
      params.push(req.query.status);
    }

    sql += ' ORDER BY u.full_name';

    const result = await query(sql, params);
    sendSuccess(res, result.rows.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      role: u.role,
      status: u.status,
      branchId: u.branch_id,
      districtId: u.district_id,
      branchName: u.branch_name,
      districtName: u.district_name,
      createdAt: u.created_at,
    })));
  } catch (error) {
    handleError(error, res);
  }
});

router.post('/', requireRoles(...USER_CREATOR_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const data = createUserSchema.parse(req.body);
    const creator = req.user!;
    const assignable = getAssignableRoles(creator.role);

    if (!assignable.includes(data.role as UserRole)) {
      throw new AppError(403, `You cannot assign the role: ${data.role}`);
    }

    const branchId = data.branchId || creator.branchId;
    const districtId = data.districtId || creator.districtId;

    if (!branchId && data.role !== 'BRANCH_MANAGER') {
      throw new AppError(400, 'Branch ID is required');
    }

    const password = data.password || 'Password123!';
    const hash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO users (bank_id, district_id, branch_id, email, password_hash, full_name, role, must_change_password, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
       RETURNING id, email, full_name, role, status`,
      [
        creator.bankId,
        districtId,
        branchId,
        data.email.toLowerCase(),
        hash,
        data.fullName,
        data.role,
        creator.userId,
      ]
    );

    await logAudit(null, {
      bankId: creator.bankId,
      userId: creator.userId,
      action: 'CREATE_USER',
      entityType: 'user',
      entityId: result.rows[0].id,
      details: { role: data.role },
    });

    sendSuccess(res, {
      ...result.rows[0],
      fullName: result.rows[0].full_name,
      temporaryPassword: data.password ? undefined : password,
    }, 201);
  } catch (error) {
    handleError(error, res);
  }
});

router.patch('/:userId', requireRoles(...USER_CREATOR_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const creator = req.user!;

    const existing = await query<{
      id: string;
      bank_id: string;
      branch_id: string | null;
      district_id: string | null;
      role: string;
    }>('SELECT id, bank_id, branch_id, district_id, role FROM users WHERE id = $1', [req.params.userId]);

    const target = existing.rows[0];
    if (!target) throw new AppError(404, 'User not found');
    if (target.bank_id !== creator.bankId) throw new AppError(403, 'Cross-bank access denied');

    if (creator.role === 'BRANCH_MANAGER' && target.branch_id !== creator.branchId) {
      throw new AppError(403, 'You can only manage users in your branch');
    }
    if (creator.role === 'DISTRICT_MANAGER' && target.district_id !== creator.districtId) {
      throw new AppError(403, 'You can only manage users in your district');
    }

    if (data.role) {
      const assignable = getAssignableRoles(creator.role);
      if (!assignable.includes(data.role as UserRole)) {
        throw new AppError(403, `You cannot assign the role: ${data.role}`);
      }
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.fullName) { updates.push(`full_name = $${idx++}`); values.push(data.fullName); }
    if (data.role) { updates.push(`role = $${idx++}`); values.push(data.role); }
    if (data.status) { updates.push(`status = $${idx++}`); values.push(data.status); }
    if (data.branchId) { updates.push(`branch_id = $${idx++}`); values.push(data.branchId); }
    if (data.districtId) { updates.push(`district_id = $${idx++}`); values.push(data.districtId); }

    if (!updates.length) throw new AppError(400, 'No fields to update');

    values.push(req.params.userId);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, email, full_name, role, status`,
      values
    );

    await logAudit(null, {
      bankId: creator.bankId,
      userId: creator.userId,
      action: 'UPDATE_USER',
      entityType: 'user',
      entityId: req.params.userId as string,
      details: data as Record<string, unknown>,
    });

    sendSuccess(res, {
      id: result.rows[0].id,
      email: result.rows[0].email,
      fullName: result.rows[0].full_name,
      role: result.rows[0].role,
      status: result.rows[0].status,
    });
  } catch (error) {
    handleError(error, res);
  }
});

router.get('/creatable-roles', requireRoles(...USER_CREATOR_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const roles = getAssignableRoles(req.user!.role);
    sendSuccess(res, roles);
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
