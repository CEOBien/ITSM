/**
 * Standardized API Response interfaces
 */

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  errors?: ValidationError[];
  meta?: ResponseMeta;
  timestamp: string;
  path?: string;
  requestId?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

export interface ResponseMeta {
  version?: string;
  requestId?: string;
  [key: string]: any;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
  results: any[];
}
