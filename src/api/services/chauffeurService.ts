import apiClient from '../client';

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
  page?: number;
  limit?: number;
}

export interface Chauffeur {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: ChauffeurStatus;
  rating: number;
  totalTrips: number;
  isVerified: boolean;
  profilePhoto?: string;
  hourlyRate: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChauffeurListResponse {
  chauffeurs: Chauffeur[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const chauffeurService = {
  getAllChauffeurs: async (filters: ChauffeurFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<any>(`/chauffeurs?${params.toString()}`);
    return response.data.data;
  },

  getChauffeurById: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: Chauffeur }>(`/chauffeurs/${id}`);
    return response.data.data;
  },

  createChauffeur: async (data: any) => {
    const response = await apiClient.post<{ success: boolean; data: Chauffeur }>(`/chauffeurs`, data);
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
};
