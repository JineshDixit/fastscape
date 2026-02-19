import apiClient from '../client';

export interface DashboardStats {
  totalBookings: {
    value: number;
    change: number;
  };
  activeVehicles: {
    value: number;
    change: number;
  };
  totalClients: {
    value: number;
    change: number;
  };
  revenue: {
    value: number;
    change: number;
  };
}

export interface RentStatus {
  complete: number;
  pending: number;
  cancelled: number;
  total: number;
}

export interface EarningSummaryItem {
  month: string;
  year: number;
  amount: number;
}

export interface BookingsOverviewItem {
  month: string;
  count: number;
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats');
    return response.data.data;
  },

  getRentStatus: async (period: 'week' | 'month' | 'year' = 'week'): Promise<RentStatus> => {
    const response = await apiClient.get<{ success: boolean; data: RentStatus }>(
      `/dashboard/rent-status?period=${period}`
    );
    return response.data.data;
  },

  getEarningSummary: async (months: number = 8): Promise<EarningSummaryItem[]> => {
    const response = await apiClient.get<{ success: boolean; data: EarningSummaryItem[] }>(
      `/dashboard/earning-summary?months=${months}`
    );
    return response.data.data;
  },

  getBookingsOverview: async (year?: number): Promise<BookingsOverviewItem[]> => {
    const url = year ? `/dashboard/bookings-overview?year=${year}` : '/dashboard/bookings-overview';
    const response = await apiClient.get<{ success: boolean; data: BookingsOverviewItem[] }>(url);
    return response.data.data;
  },
};
