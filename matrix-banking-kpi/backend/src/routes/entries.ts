import { Router, Response } from 'express';
import { z } from 'zod';
import { PoolClient } from 'pg';
import { query, withTransaction } from '../db';
import { AuthRequest, authenticate, loadActiveUser, requireRoles } from '../middleware/auth';
import { AppError, handleError, sendSuccess, logAudit } from '../utils';
import { STAFF_ROLES } from '../types';

const router = Router();

const createEntrySchema = z.object({
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  accountsOpened: z.number().int().min(0).default(0),
  depositAmount: z.number().min(0).default(0),
  mobileBankingCount: z.number().int().min(0).default(0),
  cardBankingCount: z.number().int().min(0).default(0),
  qrBankingCount: z.number().int().min(0).default(0),
  accountNumbers: z.array(z.string().min(1).max(50)).optional(),
  notes: z.string().max(1000).optional(),
});

router.use(authenticate, loadActiveUser);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { startDate, endDate, status, userId, branchId } = req.query;

    let sql = `SELECT ke.*, u.full_name, u.role, b.name as branch_name
               FROM kpi_entries ke
               JOIN users u ON u.id = ke.user_id
               JOIN branches b ON b.id = ke.branch_id
               WHERE ke.bank_id = $1`;
    const params: unknown[] = [user.bankId];
    let idx = 2;

    if (STAFF_ROLES.includes(user.role) || user.role === 'CUSTOMER_SERVICE_MANAGER') {
      sql += ` AND ke.user_id = $${idx++}`;
      params.push(user.userId);
    } else if (user.role === 'BRANCH_MANAGER') {
      sql += ` AND ke.branch_id = $${idx++}`;
      params.push(user.branchId);
    } else if (user.role === 'DISTRICT_MANAGER') {
      sql += ` AND ke.branch_id IN (SELECT id FROM branches WHERE district_id = $${idx++})`;
      params.push(user.districtId);
    }

    if (startDate) { sql += ` AND ke.entry_date >= $${idx++}`; params.push(startDate); }
    if (endDate) { sql += ` AND ke.entry_date <= $${idx++}`; params.push(endDate); }
    if (status) { sql += ` AND ke.status = $${idx++}`; params.push(status); }
    if (userId) { sql += ` AND ke.user_id = $${idx++}`; params.push(userId); }
    if (branchId) { sql += ` AND ke.branch_id = $${idx++}`; params.push(branchId); }

    sql += ' ORDER BY ke.entry_date DESC, u.full_name';

    const result = await query(sql, params);
    sendSuccess(res, result.rows);
  } catch (error) {
    handleError(error, res);
  }
});

router.post('/', requireRoles(...STAFF_ROLES, 'CUSTOMER_SERVICE_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = createEntrySchema.parse(req.body);
    const user = req.user!;

    // Check duplicate submission for same date
    const existing = await query(
      'SELECT id FROM kpi_entries WHERE user_id = $1 AND entry_date = $2',
      [user.userId, data.entryDate]
    );
    if (existing.rows[0]) {
      throw new AppError(409, 'You have already submitted an entry for this date');
    }

    const result = await withTransaction(async (client: PoolClient) => {
      const entryResult = await client.query(
        `INSERT INTO kpi_entries (bank_id, branch_id, user_id, entry_date, accounts_opened, deposit_amount,
          mobile_banking_count, card_banking_count, qr_banking_count, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          user.bankId,
          user.branchId,
          user.userId,
          data.entryDate,
          data.accountsOpened,
          data.depositAmount,
          data.mobileBankingCount,
          data.cardBankingCount,
          data.qrBankingCount,
          data.notes || null,
        ]
      );

      const entry = entryResult.rows[0];

      if (data.accountNumbers?.length) {
        if (data.accountNumbers.length !== data.accountsOpened) {
          throw new AppError(400, 'Number of account numbers must match accounts opened count');
        }
        for (const accountNumber of data.accountNumbers) {
          await client.query(
            `INSERT INTO account_entries (bank_id, account_number, kpi_entry_id, user_id)
             VALUES ($1, $2, $3, $4)`,
            [user.bankId, accountNumber.trim(), entry.id, user.userId]
          );
        }
      }

      return entry;
    });

    await logAudit(null, {
      bankId: user.bankId,
      userId: user.userId,
      action: 'CREATE_KPI_ENTRY',
      entityType: 'kpi_entry',
      entityId: result.id,
    });

    sendSuccess(res, result, 201);
  } catch (error) {
    handleError(error, res);
  }
});

router.get('/pending', requireRoles('BRANCH_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT ke.*, u.full_name, u.role
       FROM kpi_entries ke
       JOIN users u ON u.id = ke.user_id
       WHERE ke.branch_id = $1 AND ke.status = 'PENDING'
       ORDER BY ke.entry_date DESC`,
      [req.user!.branchId]
    );
    sendSuccess(res, result.rows);
  } catch (error) {
    handleError(error, res);
  }
});

router.post('/:entryId/approve', requireRoles('BRANCH_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const { status, rejectionReason } = z.object({
      status: z.enum(['APPROVED', 'REJECTED']),
      rejectionReason: z.string().optional(),
    }).parse(req.body);

    if (status === 'REJECTED' && !rejectionReason) {
      throw new AppError(400, 'Rejection reason is required');
    }

    const entryCheck = await query(
      'SELECT id, branch_id, status FROM kpi_entries WHERE id = $1',
      [req.params.entryId]
    );
    const entry = entryCheck.rows[0];
    if (!entry) throw new AppError(404, 'Entry not found');
    if (entry.branch_id !== req.user!.branchId) throw new AppError(403, 'Access denied');
    if (entry.status !== 'PENDING') throw new AppError(400, 'Entry has already been processed');

    await withTransaction(async (client: PoolClient) => {
      await client.query(
        'UPDATE kpi_entries SET status = $1 WHERE id = $2',
        [status, req.params.entryId]
      );
      await client.query(
        `INSERT INTO approvals (kpi_entry_id, approved_by, status, rejection_reason)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (kpi_entry_id) DO UPDATE SET status = $3, rejection_reason = $4, approved_by = $2`,
        [req.params.entryId, req.user!.userId, status, rejectionReason || null]
      );
    });

    sendSuccess(res, { id: req.params.entryId, status });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
