import { Router, Response } from 'express';
import { query } from '../db';
import { AuthRequest, authenticate, loadActiveUser, blockSuperAdminFromPerformance } from '../middleware/auth';
import { handleError, sendSuccess, calcPerformance } from '../utils';
import { STAFF_ROLES } from '../types';

const router = Router();

router.use(authenticate, loadActiveUser, blockSuperAdminFromPerformance);

function getDateRange(period: string, year: number, month?: number, quarter?: number) {
  if (period === 'daily') {
    const today = new Date().toISOString().split('T')[0];
    return { start: today, end: today };
  }
  if (period === 'monthly' && month) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    return { start, end };
  }
  if (period === 'quarterly' && quarter) {
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = quarter * 3;
    const start = `${year}-${String(startMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(year, endMonth, 0).getDate();
    const end = `${year}-${String(endMonth).padStart(2, '0')}-${lastDay}`;
    return { start, end };
  }
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

async function getApprovedActuals(
  bankId: string,
  filters: { userId?: string; branchId?: string; districtId?: string; start: string; end: string }
) {
  let sql = `SELECT
    COALESCE(SUM(accounts_opened), 0)::float as accounts_opened,
    COALESCE(SUM(deposit_amount), 0)::float as deposit_amount,
    COALESCE(SUM(mobile_banking_count), 0)::float as mobile_banking,
    COALESCE(SUM(card_banking_count), 0)::float as card_banking,
    COALESCE(SUM(qr_banking_count), 0)::float as qr_banking
    FROM kpi_entries
    WHERE bank_id = $1 AND status = 'APPROVED'
    AND entry_date >= $2 AND entry_date <= $3`;
  const params: unknown[] = [bankId, filters.start, filters.end];
  let idx = 4;

  if (filters.userId) { sql += ` AND user_id = $${idx++}`; params.push(filters.userId); }
  if (filters.branchId) { sql += ` AND branch_id = $${idx++}`; params.push(filters.branchId); }
  if (filters.districtId) {
    sql += ` AND branch_id IN (SELECT id FROM branches WHERE district_id = $${idx++})`;
    params.push(filters.districtId);
  }

  const result = await query(sql, params);
  return result.rows[0];
}

router.get('/staff', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const userId = STAFF_ROLES.includes(user.role) ? user.userId : (req.query.userId as string) || user.userId;

    const dailyRange = getDateRange('daily', year);
    const monthlyRange = getDateRange('monthly', year, month);
    const yearlyRange = getDateRange('yearly', year);

    const [dailyActual, monthlyActual, yearlyActual] = await Promise.all([
      getApprovedActuals(user.bankId!, { userId, start: dailyRange.start, end: dailyRange.end }),
      getApprovedActuals(user.bankId!, { userId, start: monthlyRange.start, end: monthlyRange.end }),
      getApprovedActuals(user.bankId!, { userId, start: yearlyRange.start, end: yearlyRange.end }),
    ]);

    const assignments = await query(
      `SELECT ka.*, kt.kpi_type
       FROM kpi_assignments ka
       JOIN kpi_targets kt ON kt.id = ka.kpi_target_id
       WHERE ka.user_id = $1 AND kt.year = $2`,
      [userId, year]
    );

    const kpiMap: Record<string, { daily: number; monthly: number; yearly: number; actual: { daily: number; monthly: number; yearly: number } }> = {
      DEPOSIT_MOBILIZATION: { daily: 0, monthly: 0, yearly: 0, actual: { daily: 0, monthly: 0, yearly: 0 } },
      NEW_ACCOUNTS: { daily: 0, monthly: 0, yearly: 0, actual: { daily: 0, monthly: 0, yearly: 0 } },
      MOBILE_BANKING: { daily: 0, monthly: 0, yearly: 0, actual: { daily: 0, monthly: 0, yearly: 0 } },
      CARD_BANKING: { daily: 0, monthly: 0, yearly: 0, actual: { daily: 0, monthly: 0, yearly: 0 } },
      QR_BANKING: { daily: 0, monthly: 0, yearly: 0, actual: { daily: 0, monthly: 0, yearly: 0 } },
    };

    for (const a of assignments.rows) {
      kpiMap[a.kpi_type] = {
        daily: parseFloat(a.daily_allocation),
        monthly: parseFloat(a.monthly_allocation),
        yearly: parseFloat(a.yearly_allocation),
        actual: kpiMap[a.kpi_type].actual,
      };
    }

    kpiMap.DEPOSIT_MOBILIZATION.actual = {
      daily: dailyActual.deposit_amount,
      monthly: monthlyActual.deposit_amount,
      yearly: yearlyActual.deposit_amount,
    };
    kpiMap.NEW_ACCOUNTS.actual = {
      daily: dailyActual.accounts_opened,
      monthly: monthlyActual.accounts_opened,
      yearly: yearlyActual.accounts_opened,
    };
    kpiMap.MOBILE_BANKING.actual = {
      daily: dailyActual.mobile_banking,
      monthly: monthlyActual.mobile_banking,
      yearly: yearlyActual.mobile_banking,
    };
    kpiMap.CARD_BANKING.actual = {
      daily: dailyActual.card_banking,
      monthly: monthlyActual.card_banking,
      yearly: yearlyActual.card_banking,
    };
    kpiMap.QR_BANKING.actual = {
      daily: dailyActual.qr_banking,
      monthly: monthlyActual.qr_banking,
      yearly: yearlyActual.qr_banking,
    };

    const performance = Object.entries(kpiMap).map(([type, data]) => ({
      kpiType: type,
      targets: { daily: data.daily, monthly: data.monthly, yearly: data.yearly },
      actuals: data.actual,
      performance: {
        daily: calcPerformance(data.actual.daily, data.daily),
        monthly: calcPerformance(data.actual.monthly, data.monthly),
        yearly: calcPerformance(data.actual.yearly, data.yearly),
      },
    }));

    // Daily trend (last 30 days)
    const trendResult = await query(
      `SELECT entry_date,
        SUM(accounts_opened)::int as accounts,
        SUM(deposit_amount)::float as deposits,
        SUM(mobile_banking_count)::int as mobile,
        SUM(card_banking_count)::int as card,
        SUM(qr_banking_count)::int as qr
       FROM kpi_entries
       WHERE user_id = $1 AND status = 'APPROVED'
       AND entry_date >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY entry_date ORDER BY entry_date`,
      [userId]
    );

    sendSuccess(res, { performance, trend: trendResult.rows, year, month });
  } catch (error) {
    handleError(error, res);
  }
});

router.get('/branch', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const branchId = user.branchId || (req.query.branchId as string);

    const monthlyRange = getDateRange('monthly', year, month);
    const yearlyRange = getDateRange('yearly', year);

    const [targets, monthlyActual, yearlyActual, staffPerf, pending] = await Promise.all([
      query('SELECT * FROM kpi_targets WHERE branch_id = $1 AND year = $2', [branchId, year]),
      getApprovedActuals(user.bankId!, { branchId, start: monthlyRange.start, end: monthlyRange.end }),
      getApprovedActuals(user.bankId!, { branchId, start: yearlyRange.start, end: yearlyRange.end }),
      query(
        `SELECT u.id, u.full_name, u.role,
          COALESCE(SUM(ke.accounts_opened) FILTER (WHERE ke.status = 'APPROVED'), 0)::int as accounts,
          COALESCE(SUM(ke.deposit_amount) FILTER (WHERE ke.status = 'APPROVED'), 0)::float as deposits,
          COALESCE(SUM(ke.mobile_banking_count) FILTER (WHERE ke.status = 'APPROVED'), 0)::int as mobile
         FROM users u
         LEFT JOIN kpi_entries ke ON ke.user_id = u.id
           AND ke.entry_date >= $2 AND ke.entry_date <= $3
         WHERE u.branch_id = $1 AND u.role NOT IN ('BRANCH_MANAGER')
         GROUP BY u.id ORDER BY u.full_name`,
        [branchId, monthlyRange.start, monthlyRange.end]
      ),
      query(
        `SELECT ke.*, u.full_name FROM kpi_entries ke
         JOIN users u ON u.id = ke.user_id
         WHERE ke.branch_id = $1 AND ke.status = 'PENDING'
         ORDER BY ke.entry_date DESC LIMIT 20`,
        [branchId]
      ),
    ]);

    const branchPerformance = targets.rows.map((t) => {
      const fieldMap: Record<string, keyof typeof monthlyActual> = {
        DEPOSIT_MOBILIZATION: 'deposit_amount',
        NEW_ACCOUNTS: 'accounts_opened',
        MOBILE_BANKING: 'mobile_banking',
        CARD_BANKING: 'card_banking',
        QR_BANKING: 'qr_banking',
      };
      const field = fieldMap[t.kpi_type];
      return {
        kpiType: t.kpi_type,
        monthlyTarget: parseFloat(t.monthly_target),
        yearlyTarget: parseFloat(t.yearly_target),
        monthlyActual: monthlyActual[field] || 0,
        yearlyActual: yearlyActual[field] || 0,
        monthlyPerformance: calcPerformance(monthlyActual[field] || 0, parseFloat(t.monthly_target)),
        yearlyPerformance: calcPerformance(yearlyActual[field] || 0, parseFloat(t.yearly_target)),
      };
    });

    sendSuccess(res, {
      branchPerformance,
      staffPerformance: staffPerf.rows,
      pendingApprovals: pending.rows,
      year,
      month,
    });
  } catch (error) {
    handleError(error, res);
  }
});

router.get('/district', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const districtId = user.districtId || (req.query.districtId as string);
    const monthlyRange = getDateRange('monthly', year, month);

    const branches = await query(
      `SELECT br.id, br.name, br.code,
        COALESCE(SUM(ke.accounts_opened) FILTER (WHERE ke.status = 'APPROVED'), 0)::int as accounts,
        COALESCE(SUM(ke.deposit_amount) FILTER (WHERE ke.status = 'APPROVED'), 0)::float as deposits,
        COALESCE(SUM(ke.mobile_banking_count) FILTER (WHERE ke.status = 'APPROVED'), 0)::int as mobile
       FROM branches br
       LEFT JOIN kpi_entries ke ON ke.branch_id = br.id
         AND ke.entry_date >= $2 AND ke.entry_date <= $3
       WHERE br.district_id = $1
       GROUP BY br.id ORDER BY br.name`,
      [districtId, monthlyRange.start, monthlyRange.end]
    );

    const targets = await query(
      `SELECT kt.kpi_type, SUM(kt.monthly_target)::float as monthly_target
       FROM kpi_targets kt
       JOIN branches br ON br.id = kt.branch_id
       WHERE br.district_id = $1 AND kt.year = $2
       GROUP BY kt.kpi_type`,
      [districtId, year]
    );

    sendSuccess(res, { branches: branches.rows, districtTargets: targets.rows, year, month });
  } catch (error) {
    handleError(error, res);
  }
});

router.get('/director', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const monthlyRange = getDateRange('monthly', year, month);
    const yearlyRange = getDateRange('yearly', year);

    const [monthlyActual, yearlyActual, districtSummary, targets] = await Promise.all([
      getApprovedActuals(user.bankId!, { start: monthlyRange.start, end: monthlyRange.end }),
      getApprovedActuals(user.bankId!, { start: yearlyRange.start, end: yearlyRange.end }),
      query(
        `SELECT d.name as district_name,
          COALESCE(SUM(ke.deposit_amount) FILTER (WHERE ke.status = 'APPROVED'), 0)::float as deposits,
          COALESCE(SUM(ke.accounts_opened) FILTER (WHERE ke.status = 'APPROVED'), 0)::int as accounts
         FROM districts d
         LEFT JOIN branches br ON br.district_id = d.id
         LEFT JOIN kpi_entries ke ON ke.branch_id = br.id
           AND ke.entry_date >= $2 AND ke.entry_date <= $3
         WHERE d.bank_id = $1
         GROUP BY d.id ORDER BY d.name`,
        [user.bankId, monthlyRange.start, monthlyRange.end]
      ),
      query(
        `SELECT kpi_type, SUM(monthly_target)::float as monthly_target, SUM(yearly_target)::float as yearly_target
         FROM kpi_targets WHERE bank_id = $1 AND year = $2 GROUP BY kpi_type`,
        [user.bankId, year]
      ),
    ]);

    const bankPerformance = targets.rows.map((t) => {
      const fieldMap: Record<string, string> = {
        DEPOSIT_MOBILIZATION: 'deposit_amount',
        NEW_ACCOUNTS: 'accounts_opened',
        MOBILE_BANKING: 'mobile_banking',
        CARD_BANKING: 'card_banking',
        QR_BANKING: 'qr_banking',
      };
      const field = fieldMap[t.kpi_type];
      return {
        kpiType: t.kpi_type,
        monthlyTarget: t.monthly_target,
        yearlyTarget: t.yearly_target,
        monthlyActual: monthlyActual[field] || 0,
        yearlyActual: yearlyActual[field] || 0,
        monthlyPerformance: calcPerformance(monthlyActual[field] || 0, t.monthly_target),
        yearlyPerformance: calcPerformance(yearlyActual[field] || 0, t.yearly_target),
      };
    });

    sendSuccess(res, {
      bankPerformance,
      districtSummary: districtSummary.rows,
      year,
      month,
    });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
