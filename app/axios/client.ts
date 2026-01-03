import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { authCookies } from '@/utils/cookies';

const API_CONFIG = {
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

const apiClient: AxiosInstance = axios.create(API_CONFIG);

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
  }
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
          // Use axios directly to avoid circular dependency loop with interceptors if we used apiClient
          // But since this is inside the interceptor, we should create a fresh instance or use basic fetch/axios
          // Actually, our AuthService methods use `this.post` which uses `apiClient`.
          // To avoid issues, let's manually call the refresh endpoint here or use a dedicated method.
          
          // Note: Since we need to update cookies, and we are in client.ts, we can't easily import AuthService 
          // if AuthService imports client.ts (Circular dependency).
          // AuthService DOES import client (via BaseApiService). 
          // So we should make the refresh call using raw axios here.

          const response = await axios.post(`${API_CONFIG.baseURL}/auth/refresh-token`, {
             refreshToken
          });

          if (response.data?.success && response.data?.data?.tokens) {
             const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
             // Update cookies
             // We can duplicate the logic or import authCookies (we already have it)
             // and some helper defaults.
             
             const oneDay = 24 * 60 * 60 * 1000; 
             const sevenDays = 7 * oneDay;
             const now = Date.now();
             
             authCookies.setAccessToken(accessToken, new Date(now + oneDay).toISOString());
             authCookies.setRefreshToken(newRefreshToken, new Date(now + sevenDays).toISOString());

             // Retry original request with new token
             originalRequest.headers.Authorization = `Bearer ${accessToken}`;
             return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
         // Refresh failed
         authCookies.clearAll();
         // Redirect to login or let the app handle the 401 by not rejecting? 
         // Usually we reject so the UI shows error or redirects.
         if (typeof window !== 'undefined') {
             window.location.href = '/'; 
         }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;