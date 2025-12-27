import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { UserRole } from '../types/enums';

export const rbac = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required', 'NOT_AUTHENTICATED'));
    }

    const hasPermission = allowedRoles.includes(req.user.role);

    if (!hasPermission) {
      return next(
        ApiError.forbidden(
          'You do not have permission to access this resource',
          'INSUFFICIENT_PERMISSIONS'
        )
      );
    }

    next();
  };
};
