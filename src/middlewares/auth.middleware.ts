import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { Role } from '../types';

export interface AuthRequest extends Request {
  user?: JWTPayload;
  file?: Express.Multer.File;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        console.log('❌ Authorization failed: No user in request');
        throw new UnauthorizedError('Authentication required');
      }

      console.log('🔐 Authorization check:', {
        userRole: req.user.role,
        allowedRoles,
        hasPermission: allowedRoles.includes(req.user.role as Role)
      });

      if (!allowedRoles.includes(req.user.role as Role)) {
        console.log('❌ Authorization failed: Insufficient permissions');
        throw new ForbiddenError('Insufficient permissions');
      }

      console.log('✅ Authorization passed');
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireAdmin = authorize(Role.ADMIN);
export const requireCaptain = authorize(Role.CAPTAIN, Role.ADMIN);
export const requireBarista = authorize(Role.CASHIER, Role.CAPTAIN, Role.ADMIN);

