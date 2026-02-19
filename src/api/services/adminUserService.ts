import apiClient  from '../client';

export const adminUserService = {
  /**
   * Update current admin user's language preference
   */
  updateLanguage: async (language: string) => {
    const response = await apiClient.put('/admin-users/me/language', { language });
    return response.data;
  },

  /**
   * Change current admin user's password (with current password verification)
   */
  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    const response = await apiClient.put('/admin-users/me/password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  /**
   * Update current admin user's profile
   */
  updateProfile: async (data: { firstName?: string; lastName?: string; email?: string }) => {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
  },

  /**
   * Get admin user by ID
   */
  getById: async (id: string) => {
    const response = await apiClient.get(`/admin-users/${id}`);
    return response.data;
  },

  /**
   * Get all admin users
   */
  getAll: async (params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) => {
    const response = await apiClient.get('/admin-users', { params });
    return response.data;
  },

  /**
   * Create admin user
   */
  create: async (data: { firstName: string; lastName: string; email: string; password: string }) => {
    const response = await apiClient.post('/admin-users', data);
    return response.data;
  },

  /**
   * Update admin user
   */
  update: async (id: string, data: Partial<{ firstName: string; lastName: string; email: string; isActive: boolean }>) => {
    const response = await apiClient.put(`/admin-users/${id}`, data);
    return response.data;
  },

  /**
   * Update admin user password
   */
  updatePassword: async (id: string, newPassword: string) => {
    const response = await apiClient.put(`/admin-users/${id}/password`, { newPassword });
    return response.data;
  },

  /**
   * Activate admin user
   */
  activate: async (id: string) => {
    const response = await apiClient.put(`/admin-users/${id}/activate`);
    return response.data;
  },

  /**
   * Deactivate admin user
   */
  deactivate: async (id: string) => {
    const response = await apiClient.put(`/admin-users/${id}/deactivate`);
    return response.data;
  },

  /**
   * Delete admin user
   */
  delete: async (id: string) => {
    const response = await apiClient.delete(`/admin-users/${id}`);
    return response.data;
  },
};
