import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ApiResponseData<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
  };
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode = 200,
    pagination?: PaginationMeta
  ) {
    const response: ApiResponseData<T> = {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    if (pagination) {
      response.meta!.pagination = pagination;
    }

    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }

  static error(res: Response, message: string, statusCode = 500, code?: string, details?: any) {
    const response = {
      success: false,
      error: {
        code: code || 'ERROR',
        message,
        details,
        ...(process.env.NODE_ENV === 'development' && details?.stack
          ? { stack: details.stack }
          : {}),
      },
      timestamp: new Date().toISOString(),
    };

    return res.status(statusCode).json(response);
  }
}

export const createPaginationMeta = (
  page: number,
  limit: number,
  totalCount: number
): PaginationMeta => {
  const totalPages = Math.ceil(totalCount / limit);

  return {
    page,
    limit,
    totalPages,
    totalCount,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};
