import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { authCookies, TIME_CONSTANTS } from '@/utils/cookies';

const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

const apiClient: AxiosInstance = axios.create(API_CONFIG);

// Create a separate instance for token refresh to avoid circular calls
const refreshClient: AxiosInstance = axios.create(API_CONFIG);

apiClient.interceptors.request.use(
  (config) => {
    const token = authCookies.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = authCookies.getRefreshToken();
        if (refreshToken) {
          // Use separate refresh client to avoid interceptor loops
          const response = await refreshClient.post('/auth/refresh-token', {
            refreshToken,
          });

          if (response.data?.success && response.data?.data) {
            const tokenData = response.data.data;
            const { accessToken, refreshToken: newRefreshToken } = tokenData;
            const now = Date.now();

            // Update cookies with correct expiration times (15 minutes for access, 7 days for refresh)
            authCookies.setAccessToken(accessToken, new Date(now + 15 * TIME_CONSTANTS.ONE_MINUTE).toISOString());
            authCookies.setRefreshToken(newRefreshToken, new Date(now + TIME_CONSTANTS.SEVEN_DAYS).toISOString());

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed - clear auth state
        console.error('Token refresh failed:', refreshError);
        authCookies.clearAll();

        // Redirect to login if in browser
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
