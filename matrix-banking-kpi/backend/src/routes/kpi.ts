import { Router, Response } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db';
import { AuthRequest, authenticate, loadActiveUser, requireRoles } from '../middleware/auth';
import { AppError, handleError, sendSuccess, calcTargets, logAudit } from '../utils';
import { KPI_TYPES, KpiType } from '../types';

const router = Router();

const setTargetsSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  targets: z.array(z.object({
    kpiType: z.enum(['DEPOSIT_MOBILIZATION', 'NEW_ACCOUNTS', 'MOBILE_BANKING', 'CARD_BANKING', 'QR_BANKING']),
    yearlyTarget: z.number().min(0),
  })).min(1),
});

const assignSchema = z.object({
  year: z.number().int(),
  assignments: z.array(z.object({
    userId: z.string().uuid(),
    kpiType: z.enum(['DEPOSIT_MOBILIZATION', 'NEW_ACCOUNTS', 'MOBILE_BANKING', 'CARD_BANKING', 'QR_BANKING']),
    yearlyAllocation: z.number().min(0),
  })),
});

router.use(authenticate, loadActiveUser);

router.get('/targets', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const branchId = (req.query.branchId as string) || user.branchId;

    if (!branchId) throw new AppError(400, 'Branch ID required');

    const result = await query(
      `SELECT kt.*, u.full_name as set_by_name
       FROM kpi_targets kt
       JOIN users u ON u.id = kt.set_by
       WHERE kt.branch_id = $1 AND kt.year = $2
       ORDER BY kt.kpi_type`,
      [branchId, year]
    );

    sendSuccess(res, result.rows);
  } catch (error) {
    handleError(error, res);
  }
});

router.post('/targets', requireRoles('BRANCH_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = setTargetsSchema.parse(req.body);
    const user = req.user!;
    const branchId = user.branchId!;

    const results = await withTransaction(async (client) => {
      const inserted = [];
      for (const target of data.targets) {
        const calc = calcTargets(target.yearlyTarget);
        const result = await client.query(
          `INSERT INTO kpi_targets (bank_id, branch_id, year, kpi_type, yearly_target, quarterly_target, monthly_target, daily_target, set_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (branch_id, year, kpi_type)
           DO UPDATE SET yearly_target = $5, quarterly_target = $6, monthly_target = $7, daily_target = $8, set_by = $9
           RETURNING *`,
          [
            user.bankId,
            branchId,
            data.year,
            target.kpiType,
            calc.yearly,
            calc.quarterly,
            calc.monthly,
            calc.daily,
            user.userId,
          ]
        );
        inserted.push(result.rows[0]);
      }
      return inserted;
    });

    await logAudit(null, {
      bankId: user.bankId,
      userId: user.userId,
      action: 'SET_KPI_TARGETS',
      entityType: 'kpi_targets',
      details: { year: data.year, count: results.length },
    });

    sendSuccess(res, results, 201);
  } catch (error) {
    handleError(error, res);
  }
});

router.get('/assignments', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const branchId = (req.query.branchId as string) || user.branchId;

    const result = await query(
      `SELECT ka.*, u.full_name, u.role, kt.kpi_type, kt.yearly_target as branch_yearly_target
       FROM kpi_assignments ka
       JOIN users u ON u.id = ka.user_id
       JOIN kpi_targets kt ON kt.id = ka.kpi_target_id
       WHERE ka.branch_id = $1 AND kt.year = $2
       ORDER BY u.full_name, kt.kpi_type`,
      [branchId, year]
    );

    sendSuccess(res, result.rows);
  } catch (error) {
    handleError(error, res);
  }
});

router.post('/assignments', requireRoles('BRANCH_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = assignSchema.parse(req.body);
    const user = req.user!;
    const branchId = user.branchId!;

    // Validate allocations equal branch targets per KPI type
    const targetsResult = await query<{ id: string; kpi_type: string; yearly_target: string }>(
      'SELECT id, kpi_type, yearly_target FROM kpi_targets WHERE branch_id = $1 AND year = $2',
      [branchId, data.year]
    );

    const targetMap = new Map(targetsResult.rows.map((t) => [t.kpi_type, t]));

    for (const kpiType of KPI_TYPES) {
      const branchTarget = targetMap.get(kpiType);
      if (!branchTarget) continue;

      const totalAllocated = data.assignments
        .filter((a) => a.kpiType === kpiType)
        .reduce((sum, a) => sum + a.yearlyAllocation, 0);

      const branchYearly = parseFloat(branchTarget.yearly_target);
      if (Math.abs(totalAllocated - branchYearly) > 0.01) {
        throw new AppError(
          400,
          `KPI ${kpiType}: Staff allocations (${totalAllocated}) must equal branch target (${branchYearly})`
        );
      }
    }

    const results = await withTransaction(async (client) => {
      const inserted = [];
      for (const assignment of data.assignments) {
        const target = targetMap.get(assignment.kpiType);
        if (!target) throw new AppError(400, `No branch target set for ${assignment.kpiType}`);

        const calc = calcTargets(assignment.yearlyAllocation);
        const result = await client.query(
          `INSERT INTO kpi_assignments (bank_id, branch_id, user_id, kpi_target_id, yearly_allocation, quarterly_allocation, monthly_allocation, daily_allocation, assigned_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (user_id, kpi_target_id)
           DO UPDATE SET yearly_allocation = $5, quarterly_allocation = $6, monthly_allocation = $7, daily_allocation = $8
           RETURNING *`,
          [
            user.bankId,
            branchId,
            assignment.userId,
            target.id,
            calc.yearly,
            calc.quarterly,
            calc.monthly,
            calc.daily,
            user.userId,
          ]
        );
        inserted.push(result.rows[0]);
      }
      return inserted;
    });

    sendSuccess(res, results, 201);
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
