export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: any;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    isOperational = true,
    details?: any,
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message: string, code = 'BAD_REQUEST', details?: any) {
    return new ApiError(400, message, code, true, details);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new ApiError(404, message, code);
  }

  static conflict(message: string, code = 'CONFLICT', details?: any) {
    return new ApiError(409, message, code, true, details);
  }

  static unprocessableEntity(message: string, code = 'VALIDATION_ERROR', details?: any) {
    return new ApiError(422, message, code, true, details);
  }

  static tooManyRequests(message = 'Too many requests', code = 'RATE_LIMIT_EXCEEDED') {
    return new ApiError(429, message, code);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    return new ApiError(500, message, code, false);
  }

  static serviceUnavailable(message = 'Service unavailable', code = 'SERVICE_UNAVAILABLE') {
    return new ApiError(503, message, code);
  }
}
