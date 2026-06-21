import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { AuthRequest, authenticate, loadActiveUser, requireRoles } from '../middleware/auth';
import { AppError, handleError, sendSuccess, logAudit } from '../utils';

const router = Router();

const createDistrictSchema = z.object({
  name: z.string().min(2).max(255),
  code: z.string().min(2).max(50),
});

const createBranchSchema = z.object({
  name: z.string().min(2).max(255),
  code: z.string().min(2).max(50),
  districtId: z.string().uuid(),
});

router.use(authenticate, loadActiveUser);

router.get('/districts', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    let sql = `SELECT d.id, d.name, d.code, d.is_active, d.bank_id,
                      COUNT(b.id)::int as branch_count
               FROM districts d
               LEFT JOIN branches b ON b.district_id = d.id`;
    const params: string[] = [];

    if (user.role === 'SUPER_ADMIN') {
      sql += ' WHERE 1=1';
    } else if (user.role === 'DISTRICT_MANAGER') {
      sql += ' WHERE d.id = $1';
      params.push(user.districtId!);
    } else if (user.role === 'DIRECTOR_DEPOSIT_MOBILIZATION') {
      sql += ' WHERE d.bank_id = $1';
      params.push(user.bankId!);
    } else {
      sql += ' WHERE d.bank_id = $1';
      params.push(user.bankId!);
    }

    sql += ' GROUP BY d.id ORDER BY d.name';

    const result = await query(sql, params);
    sendSuccess(res, result.rows);
  } catch (error) {
    handleError(error, res);
  }
});

router.post(
  '/districts',
  requireRoles('DIRECTOR_DEPOSIT_MOBILIZATION', 'DISTRICT_MANAGER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = createDistrictSchema.parse(req.body);
      const bankId = req.user!.bankId!;

      const result = await query(
        `INSERT INTO districts (bank_id, name, code) VALUES ($1, $2, $3) RETURNING *`,
        [bankId, data.name, data.code.toUpperCase()]
      );

      await logAudit(null, {
        bankId,
        userId: req.user!.userId,
        action: 'CREATE_DISTRICT',
        entityType: 'district',
        entityId: result.rows[0].id,
      });

      sendSuccess(res, result.rows[0], 201);
    } catch (error) {
      handleError(error, res);
    }
  }
);

router.get('/branches', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    let sql = `SELECT br.id, br.name, br.code, br.is_active, br.district_id, br.bank_id,
                      d.name as district_name
               FROM branches br
               JOIN districts d ON d.id = br.district_id`;
    const params: string[] = [];
    let paramIdx = 1;

    if (user.role === 'BRANCH_MANAGER' || STAFF_ONLY(user.role)) {
      sql += ` WHERE br.id = $${paramIdx++}`;
      params.push(user.branchId!);
    } else if (user.role === 'DISTRICT_MANAGER') {
      sql += ` WHERE br.district_id = $${paramIdx++}`;
      params.push(user.districtId!);
    } else if (user.bankId) {
      sql += ` WHERE br.bank_id = $${paramIdx++}`;
      params.push(user.bankId);
    }

    if (req.query.districtId) {
      sql += params.length ? ' AND' : ' WHERE';
      sql += ` br.district_id = $${paramIdx++}`;
      params.push(req.query.districtId as string);
    }

    sql += ' ORDER BY br.name';

    const result = await query(sql, params);
    sendSuccess(res, result.rows);
  } catch (error) {
    handleError(error, res);
  }
});

router.post(
  '/branches',
  requireRoles('DISTRICT_MANAGER', 'DIRECTOR_DEPOSIT_MOBILIZATION'),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = createBranchSchema.parse(req.body);
      const bankId = req.user!.bankId!;

      const districtCheck = await query(
        'SELECT id FROM districts WHERE id = $1 AND bank_id = $2',
        [data.districtId, bankId]
      );
      if (!districtCheck.rows[0]) throw new AppError(404, 'District not found');

      const result = await query(
        `INSERT INTO branches (bank_id, district_id, name, code) VALUES ($1, $2, $3, $4) RETURNING *`,
        [bankId, data.districtId, data.name, data.code.toUpperCase()]
      );

      await logAudit(null, {
        bankId,
        userId: req.user!.userId,
        action: 'CREATE_BRANCH',
        entityType: 'branch',
        entityId: result.rows[0].id,
      });

      sendSuccess(res, result.rows[0], 201);
    } catch (error) {
      handleError(error, res);
    }
  }
);

function STAFF_ONLY(role: string): boolean {
  return [
    'CUSTOMER_SERVICE_MANAGER',
    'CUSTOMER_SERVICE_OFFICER',
    'CASHIER',
    'CONTROLLER',
    'CREDIT_RELATIONSHIP_MANAGER',
  ].includes(role);
}

export default router;
