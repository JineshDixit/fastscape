import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { authCookies, TIME_CONSTANTS } from '@/utils/cookies';

const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://3.111.162.90:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    indexes: null, // This serializes arrays as ?model=A&model=B instead of ?model[]=A&model[]=B
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

// Track active refresh state to prevent multiple concurrent refresh calls
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (token: string | null = null) => {
  refreshQueue.forEach((callback) => callback(token || ''));
  refreshQueue = [];
};

// Cross-tab synchronization constants
const LS_THROTTLE_REFRESH = 'auth_refresh_in_progress';
const LS_NEW_ACCESS_TOKEN = 'auth_new_access_token';

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If a refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      // Add small random delay to reduce race condition likelihood
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 50));

      // Check if another tab is currently refreshing
      const anotherTabRefreshingAt = localStorage.getItem(LS_THROTTLE_REFRESH);
      if (anotherTabRefreshingAt) {
        const refreshTime = parseInt(anotherTabRefreshingAt, 10);
        const now = Date.now();

        // If it was less than 10 seconds ago, consider it active
        if (now - refreshTime < 10000) {
          isRefreshing = true;
          return new Promise((resolve) => {
            // Listen for storage event from other tab
            const handleStorageChange = (e: StorageEvent) => {
              if (e.key === LS_NEW_ACCESS_TOKEN && e.newValue) {
                window.removeEventListener('storage', handleStorageChange);
                isRefreshing = false;
                originalRequest.headers.Authorization = `Bearer ${e.newValue}`;
                resolve(apiClient(originalRequest));
                processQueue(e.newValue);
              }
            };
            window.addEventListener('storage', handleStorageChange);

            // Wait for 10 seconds before giving up
            setTimeout(() => {
              if (isRefreshing) {
                window.removeEventListener('storage', handleStorageChange);
                isRefreshing = false;
                // If it timed out, try to refresh ourselves if no new token appeared
                const token = authCookies.getAccessToken();
                if (token) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                  resolve(apiClient(originalRequest));
                }
              }
            }, 10000);

            refreshQueue.push((token: string) => {
              isRefreshing = false;
              window.removeEventListener('storage', handleStorageChange);
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            });
          });
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;
      localStorage.setItem(LS_THROTTLE_REFRESH, Date.now().toString());

      try {
        const refreshToken = authCookies.getRefreshToken();
        if (refreshToken) {
          // Use separate refresh client to avoid interceptor loops
          const response = await refreshClient.post('/auth/refresh-token', {
            refreshToken,
          });

          if (response.data?.success && response.data?.data) {
            const tokenData = response.data.data;
            const {
              accessToken,
              refreshToken: newRefreshToken,
              accessTokenExpiresAt,
              refreshTokenExpiresAt,
            } = tokenData;

            // Update cookies with server-provided expiration times
            authCookies.setAccessToken(accessToken, accessTokenExpiresAt);
            authCookies.setRefreshToken(newRefreshToken, refreshTokenExpiresAt);

            // Notify other tabs
            localStorage.setItem(LS_NEW_ACCESS_TOKEN, accessToken);
            // Clear immediately after setting so it doesn't linger
            setTimeout(() => localStorage.removeItem(LS_NEW_ACCESS_TOKEN), 100);
            localStorage.removeItem(LS_THROTTLE_REFRESH);

            // Process queued requests with the new token
            processQueue(accessToken);

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError: any) {
        // Refresh failed - only clear and redirect if it's an auth error (400 or 401)
        const isAuthError = refreshError.response?.status === 401 || refreshError.response?.status === 400;

        if (isAuthError) {
          localStorage.removeItem(LS_THROTTLE_REFRESH);
          localStorage.removeItem(LS_NEW_ACCESS_TOKEN);
          processQueue(null);
          console.error('Token refresh failed (Unauthorized):', refreshError);
          authCookies.clearAll();

          // Redirect to login if in browser
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        } else {
          // For network errors or 500s, keep the state and let the request fail
          // This allows users to retry if the server is temporarily down
          localStorage.removeItem(LS_THROTTLE_REFRESH);
          console.error('Token refresh failed (Network/Server):', refreshError);
          processQueue(null);
        }
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
