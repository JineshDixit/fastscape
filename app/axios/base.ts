import type { AxiosResponse } from 'axios';
import apiClient from './client';
import type { ApiResponse, PaginatedResponse, RequestConfig } from '../../common/interfaces';

/**
 * Base API service class with common CRUD operations
 */
export class BaseApiService {
  protected endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  /**
   * GET request
   */
  async get<T>(path: string = '', config?: RequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.get(`${this.endpoint}${path}`, config);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T, D = any>(path: string = '', data?: D, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.post(`${this.endpoint}${path}`, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T, D = any>(path: string = '', data?: D, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.put(`${this.endpoint}${path}`, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T, D = any>(path: string = '', data?: D, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.patch(`${this.endpoint}${path}`, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(path: string = '', config?: RequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.delete(`${this.endpoint}${path}`, config);
    return response.data;
  }

  /**
   * Get all items with pagination
   */
  async getAll<T>(params?: Record<string, any>): Promise<PaginatedResponse<T>> {
    const response: AxiosResponse<PaginatedResponse<T>> = await apiClient.get(this.endpoint, { params });
    return response.data;
  }

  /**
   * Get item by ID
   */
  async getById<T>(id: string | number): Promise<ApiResponse<T>> {
    return this.get<T>(`/${id}`);
  }

  /**
   * Create new item
   */
  async create<T, D = any>(data: D): Promise<ApiResponse<T>> {
    return this.post<T, D>('', data);
  }

  /**
   * Update item by ID
   */
  async update<T, D = any>(id: string | number, data: D): Promise<ApiResponse<T>> {
    return this.put<T, D>(`/${id}`, data);
  }

  /**
   * Partially update item by ID
   */
  async partialUpdate<T, D = any>(id: string | number, data: D): Promise<ApiResponse<T>> {
    return this.patch<T, D>(`/${id}`, data);
  }

  /**
   * Delete item by ID
   */
  async deleteById<T>(id: string | number): Promise<ApiResponse<T>> {
    return this.delete<T>(`/${id}`);
  }
}
