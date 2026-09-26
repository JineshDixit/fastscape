import apiClient from '../client';
import type { PaginatedApiResponse, PaginationMeta } from '@/common/interface/apiInterface';

export interface LocationFilters {
  city?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface Location {
  id: string;
  name: string;
  city: string;
  code?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationListResponse {
  locations: Location[];
  pagination: PaginationMeta;
}

export const locationService = {
  getAllLocations: async (filters: LocationFilters = {}): Promise<LocationListResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<PaginatedApiResponse<Location>>(`/locations?${params.toString()}`);
    return {
      locations: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getAllCities: async () => {
    const response = await apiClient.get<{ success: boolean; data: string[] }>(`/locations/cities`);
    return response.data.data;
  },

  getLocationById: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: Location }>(`/locations/${id}`);
    return response.data.data;
  },

  createLocation: async (data: any) => {
    const response = await apiClient.post<{ success: boolean; data: Location }>(`/locations`, data);
    return response.data.data;
  },

  updateLocation: async (id: string, data: any) => {
    const response = await apiClient.put<{ success: boolean; data: Location }>(`/locations/${id}`, data);
    return response.data.data;
  },

  toggleLocationStatus: async (id: string) => {
    const response = await apiClient.patch<{ success: boolean; data: Location }>(`/locations/${id}/toggle-status`, {});
    return response.data.data;
  },

  deleteLocation: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/locations/${id}`);
    return response.data;
  },

  exportLocations: async (filters: LocationFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/locations/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
