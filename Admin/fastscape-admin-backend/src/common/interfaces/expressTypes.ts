import { Request } from 'express';

/**
 * Extended Request interface with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles?: string[];
    permissions?: string[];
  };
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

/**
 * Query filters interface
 */
export interface QueryFilters {
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  [key: string]: any;
}
