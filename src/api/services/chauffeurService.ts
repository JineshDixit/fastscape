import apiClient from '../client';
import type { PaginatedApiResponse, PaginationMeta } from '@/common/interface/apiInterface';

export const ChauffeurStatus = {
  AVAILABLE: 'AVAILABLE',
  BUSY: 'BUSY',
  OFF_DUTY: 'OFF_DUTY',
  ON_BREAK: 'ON_BREAK',
} as const;

export type ChauffeurStatus = (typeof ChauffeurStatus)[keyof typeof ChauffeurStatus];

export interface ChauffeurFilters {
  status?: ChauffeurStatus;
  isVerified?: boolean;
  minRating?: number;
  city?: string;
  experienceLevel?: string;
  nationality?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface Chauffeur {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  profilePhoto?: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  licenseIssuingCountry: string;
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERIENCED' | 'EXPERT';
  yearsOfExperience: number;
  languages: string[];
  specializations: string[];
  hourlyRate: string | number;
  currency: string;
  status: ChauffeurStatus;
  rating: string | number;
  totalTrips: number;
  isVerified: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  notes?: string;
  joinedAt: string;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChauffeurListResponse {
  chauffeurs: Chauffeur[];
  pagination: PaginationMeta;
}

export const chauffeurService = {
  getAllChauffeurs: async (filters: ChauffeurFilters = {}): Promise<ChauffeurListResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<PaginatedApiResponse<Chauffeur>>(`/chauffeurs?${params.toString()}`);
    return {
      chauffeurs: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getChauffeurById: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: Chauffeur }>(`/chauffeurs/${id}`);
    return response.data.data;
  },

  createChauffeur: async (data: any) => {
    const response = await apiClient.post<{ success: boolean; data: Chauffeur }>(`/chauffeurs`, data);
    return response.data.data;
  },

  updateChauffeur: async (id: string, data: any) => {
    const response = await apiClient.put<{ success: boolean; data: Chauffeur }>(`/chauffeurs/${id}`, data);
    return response.data.data;
  },

  updateChauffeurStatus: async (id: string, status: ChauffeurStatus) => {
    const response = await apiClient.put<{ success: boolean; data: Chauffeur }>(`/chauffeurs/${id}/status`, {
      status,
    });
    return response.data.data;
  },

  verifyChauffeur: async (id: string) => {
    const response = await apiClient.put<{ success: boolean; data: Chauffeur }>(`/chauffeurs/${id}/verify`, {});
    return response.data.data;
  },

  deleteChauffeur: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/chauffeurs/${id}`);
    return response.data;
  },

  exportChauffeurs: async (filters: ChauffeurFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/chauffeurs/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
