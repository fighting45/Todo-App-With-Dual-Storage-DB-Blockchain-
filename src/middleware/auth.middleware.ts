import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/api-error';
import { config } from '../config';
import { UserRole } from '../types/enums';

interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw ApiError.unauthorized('No token provided', 'NO_TOKEN');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Invalid token format. Use: Bearer <token>', 'INVALID_FORMAT');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw ApiError.unauthorized('Token is missing', 'TOKEN_MISSING');
    }

    const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;

    const userRepository = new UserRepository();
    const user = await userRepository.findById(payload.userId);

    /**
     * Check if user exists
     */
    if (!user) {
      throw ApiError.unauthorized('User not found', 'USER_NOT_FOUND');
    }

    req.user = user;

    next();
  } catch (error) {
    if ((error as any).name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid token', 'INVALID_TOKEN'));
    }

    if ((error as any).name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token expired', 'TOKEN_EXPIRED'));
    }

    /**
     * If it's already an ApiError, just pass it along
     */
    if (error instanceof ApiError) {
      return next(error);
    }

    /**
     * Unknown error - return generic error
     */
    next(ApiError.unauthorized('Authentication failed', 'AUTH_FAILED'));
  }
};
