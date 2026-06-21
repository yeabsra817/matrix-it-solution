import { Router, Response } from 'express';
import { query } from '../db';
import { AuthRequest, authenticate, loadActiveUser, blockSuperAdminFromPerformance } from '../middleware/auth';
import { handleError, sendSuccess } from '../utils';

const router = Router();

router.use(authenticate, loadActiveUser, blockSuperAdminFromPerformance);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { startDate, endDate, branchId, userId, kpiType } = req.query;

    const start = (startDate as string) || `${new Date().getFullYear()}-01-01`;
    const end = (endDate as string) || new Date().toISOString().split('T')[0];

    let sql = `SELECT ke.entry_date, ke.accounts_opened, ke.deposit_amount,
                      ke.mobile_banking_count, ke.card_banking_count, ke.qr_banking_count,
                      ke.status, u.full_name, u.role, b.name as branch_name
               FROM kpi_entries ke
               JOIN users u ON u.id = ke.user_id
               JOIN branches b ON b.id = ke.branch_id
               WHERE ke.bank_id = $1 AND ke.status = 'APPROVED'
               AND ke.entry_date >= $2 AND ke.entry_date <= $3`;
    const params: unknown[] = [user.bankId, start, end];
    let idx = 4;

    if (user.role === 'BRANCH_MANAGER') {
      sql += ` AND ke.branch_id = $${idx++}`;
      params.push(user.branchId);
    } else if (user.role === 'DISTRICT_MANAGER') {
      sql += ` AND ke.branch_id IN (SELECT id FROM branches WHERE district_id = $${idx++})`;
      params.push(user.districtId);
    }

    if (branchId) { sql += ` AND ke.branch_id = $${idx++}`; params.push(branchId); }
    if (userId) { sql += ` AND ke.user_id = $${idx++}`; params.push(userId); }

    sql += ' ORDER BY ke.entry_date DESC, u.full_name';

    const result = await query(sql, params);

    const summary = {
      totalAccounts: 0,
      totalDeposits: 0,
      totalMobile: 0,
      totalCard: 0,
      totalQr: 0,
      entryCount: result.rows.length,
    };

    for (const row of result.rows) {
      summary.totalAccounts += row.accounts_opened;
      summary.totalDeposits += parseFloat(row.deposit_amount);
      summary.totalMobile += row.mobile_banking_count;
      summary.totalCard += row.card_banking_count;
      summary.totalQr += row.qr_banking_count;
    }

    sendSuccess(res, {
      entries: result.rows,
      summary,
      filters: { startDate: start, endDate: end, branchId, userId, kpiType },
    });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
