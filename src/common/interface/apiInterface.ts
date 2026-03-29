export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Common API response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  pagination?: PaginationMeta;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Common request types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  search?: string;
  filters?: Record<string, any>;
}

// HTTP method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request configuration
export interface RequestConfig {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  data?: any;
}
