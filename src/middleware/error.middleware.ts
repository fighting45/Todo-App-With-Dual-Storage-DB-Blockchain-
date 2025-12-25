import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { ApiResponse } from '../utils/api-response';
import logger from '../utils/logger';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

/**
 * Handle Zod validation errors
 */
const handleZodError = (error: ZodError): ApiError => {
  const errors = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return ApiError.unprocessableEntity('Validation failed', 'VALIDATION_ERROR', errors);
};

/**
 * Handle Mongoose validation errors
 */
const handleMongooseValidationError = (error: mongoose.Error.ValidationError): ApiError => {
  const errors = Object.values(error.errors).map((err) => ({
    field: err.path,
    message: err.message,
  }));

  return ApiError.unprocessableEntity('Validation failed', 'VALIDATION_ERROR', errors);
};

/**
 * Handle Mongoose duplicate key errors
 */
const handleMongoDuplicateKeyError = (error: any): ApiError => {
  const field = Object.keys(error.keyPattern)[0];
  const value = error.keyValue[field];

  return ApiError.conflict(
    `${field} '${value}' already exists`,
    'DUPLICATE_KEY_ERROR',
    { field, value }
  );
};

/**
 * Handle Mongoose cast errors
 */
const handleMongoCastError = (error: mongoose.Error.CastError): ApiError => {
  return ApiError.badRequest(`Invalid ${error.path}: ${error.value}`, 'INVALID_ID');
};

/**
 * Handle JWT errors
 */
const handleJWTError = (): ApiError => {
  return ApiError.unauthorized('Invalid token. Please log in again.', 'INVALID_TOKEN');
};

const handleJWTExpiredError = (): ApiError => {
  return ApiError.unauthorized('Your token has expired. Please log in again.', 'TOKEN_EXPIRED');
};

/**
 * Central error handling middleware
 */
export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = err;

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?._id,
  });

  // Convert known errors to ApiError
  if (error instanceof ZodError) {
    error = handleZodError(error);
  } else if (error instanceof mongoose.Error.ValidationError) {
    error = handleMongooseValidationError(error);
  } else if (error instanceof mongoose.Error.CastError) {
    error = handleMongoCastError(error);
  } else if ((error as any).code === 11000) {
    error = handleMongoDuplicateKeyError(error);
  } else if (error.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (error.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // If not an ApiError, convert to internal server error
  if (!(error instanceof ApiError)) {
    const statusCode = (error as any).statusCode || 500;
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message || 'Internal server error';

    error = new ApiError(statusCode, message, 'INTERNAL_ERROR', false);
  }

  // Send error response
  const apiError = error as ApiError;
  ApiResponse.error(
    res,
    apiError.message,
    apiError.statusCode,
    apiError.code,
    process.env.NODE_ENV === 'development'
      ? {
          stack: apiError.stack,
          details: apiError.details,
        }
      : apiError.details
  );
};

/**
 * 404 Not Found middleware
 */
export const notFoundMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
};
