import apiClient from '../client';

export const VerificationStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;

export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export interface UserFilters {
  verificationStatus?: VerificationStatus;
  isBlocked?: boolean;
  country?: string;
  city?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface UserDrivingInfo {
  id: string;
  userId: string;
  licenseIssuingCountry: string;
  licenseExpiryDate: string;
  drivingExperienceYears: string;
  visaStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserIdentityDocument {
  id: string;
  userId: string;
  verified: boolean;
  verificationStatus: VerificationStatus;
  verificationDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingSummary {
  id: string;
  bookingStatus: string;
  paymentStatus: string;
  bookingType: string;
  startDatetime: string;
  createdAt: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isBlocked: boolean;
  verificationStatus: VerificationStatus;
  verificationDate: string | null;
  createdAt: string;
  updatedAt: string;
  UserDrivingInfo?: UserDrivingInfo;
  UserIdentityDocument?: UserIdentityDocument;
  Bookings?: BookingSummary[];
}

export interface UserListResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const userService = {
  getAllUsers: async (filters: UserFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<any>(`/users?${params.toString()}`);
    return {
      users: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getUserById: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: User }>(`/users/${id}`);
    return response.data.data;
  },

  updateVerificationStatus: async (id: string, verificationStatus: VerificationStatus) => {
    const response = await apiClient.put<{ success: boolean; data: User }>(`/users/${id}/verification-status`, {
      verificationStatus,
    });
    return response.data.data;
  },

  toggleBlockUser: async (id: string, isBlocked: boolean, reason?: string) => {
    const response = await apiClient.put<{ success: boolean; data: User }>(`/users/${id}/block`, {
      isBlocked,
      reason,
    });
    return response.data.data;
  },
};
