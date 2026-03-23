import { PaginationResult } from '../interfaces';

/**
 * Pagination Utility - standardized pagination helper
 */
export class PaginationUtil {
  static paginate<T>(data: T[], total: number, page: number, limit: number): PaginationResult<T> {
    const totalPages = Math.ceil(total / limit);
    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  static getPaginationMeta(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}
