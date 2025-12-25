export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const parsePaginationOptions = (query: any): PaginationOptions => {
  const page = parseInt(query.page as string, 10) || 1;
  const limit = Math.min(parseInt(query.limit as string, 10) || 10, 100); // Max 100 items
  const sortBy = (query.sortBy as string) || 'createdAt';
  const sortOrder = (query.sortOrder as 'asc' | 'desc') || 'desc';

  return {
    page: Math.max(page, 1), // Ensure page is at least 1
    limit: Math.max(limit, 1), // Ensure limit is at least 1
    sortBy,
    sortOrder,
  };
};

export const getSkipValue = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

export const getSortObject = (sortBy: string, sortOrder: 'asc' | 'desc'): Record<string, 1 | -1> => {
  return {
    [sortBy]: sortOrder === 'asc' ? 1 : -1,
  };
};
