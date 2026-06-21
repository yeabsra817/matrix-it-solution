import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { query } from '../db';
import { JwtPayload, UserRole, PERFORMANCE_VIEW_ROLES } from '../types';
import { AppError, handleError } from '../utils';

export interface AuthRequest extends Request {
  user?: JwtPayload & { fullName?: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return handleError(new AppError(401, 'Invalid or expired token'), res);
    }
    handleError(error, res);
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return handleError(new AppError(401, 'Authentication required'), res);
    }
    if (!roles.includes(req.user.role)) {
      return handleError(new AppError(403, 'You do not have permission to perform this action'), res);
    }
    next();
  };
}

export function blockSuperAdminFromPerformance(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role === 'SUPER_ADMIN') {
    return handleError(
      new AppError(403, 'Super Admin cannot access bank performance data'),
      res
    );
  }
  if (req.user && !PERFORMANCE_VIEW_ROLES.includes(req.user.role)) {
    return handleError(new AppError(403, 'You do not have permission to view performance data'), res);
  }
  next();
}

export async function enforceBankIsolation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const bankId = req.params.bankId || req.body.bankId || req.query.bankId;
    if (bankId && bankId !== req.user.bankId) {
      throw new AppError(403, 'Cross-bank access is not permitted');
    }

    next();
  } catch (error) {
    handleError(error, res);
  }
}

export async function loadActiveUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const result = await query<{
      id: string;
      status: string;
      full_name: string;
      bank_id: string | null;
      district_id: string | null;
      branch_id: string | null;
      role: UserRole;
    }>(
      'SELECT id, status, full_name, bank_id, district_id, branch_id, role FROM users WHERE id = $1',
      [req.user.userId]
    );

    const user = result.rows[0];
    if (!user) {
      throw new AppError(401, 'User not found');
    }
    if (user.status === 'BLOCKED') {
      throw new AppError(403, 'Your account has been blocked. Contact your administrator.');
    }
    if (user.status === 'INACTIVE') {
      throw new AppError(403, 'Your account is inactive. Contact your administrator.');
    }

    req.user = {
      ...req.user,
      bankId: user.bank_id,
      districtId: user.district_id,
      branchId: user.branch_id,
      role: user.role,
      fullName: user.full_name,
    };

    next();
  } catch (error) {
    handleError(error, res);
  }
}
