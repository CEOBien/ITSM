export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  filters?: Record<string, any>;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface FilterOptions {
  startDate?: Date;
  endDate?: Date;
  status?: string | string[];
  priority?: string | string[];
  assigneeId?: string;
  categoryId?: string;
  [key: string]: any;
}
