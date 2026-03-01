import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

// API configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
};

// Create axios instance
const apiClient: AxiosInstance = axios.create(API_CONFIG);

// Request interceptor - Use auth service for all token operations
apiClient.interceptors.request.use(
  async (config) => {
    // Skip token handling for public auth endpoints
    const publicEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/forgot-password',
      '/auth/reset-password',
    ];
    const isPublicEndpoint = publicEndpoints.some((endpoint) => config.url?.includes(endpoint));

    if (isPublicEndpoint) {
      return config;
    }

    // Import authService here to avoid circular dependency
    const { authService } = await import('./services/auth');

    // Get valid token from auth service (handles refresh automatically)
    const validToken = await authService.getValidAccessToken();

    if (validToken) {
      config.headers.Authorization = `Bearer ${validToken}`;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasToken: !!validToken,
      });
    }

    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  },
);

// Response interceptor - Simplified, let auth service handle everything
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log('API Response:', {
        status: response.status,
        url: response.config.url,
      });
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors by attempting to refresh token
    const publicEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/forgot-password',
      '/auth/reset-password',
    ];
    const isPublicEndpoint = publicEndpoints.some((endpoint) => originalRequest?.url?.includes(endpoint));

    // If 401 and not already retried and not a public endpoint
    if (error.response?.status === 401 && !originalRequest._retry && !isPublicEndpoint) {
      originalRequest._retry = true;

      try {
        if (import.meta.env.DEV) {
          console.warn('401 detected, attempting token refresh and retry...');
        }

        // Import authService here to avoid circular dependency
        const { authService } = await import('./services/auth');

        // This will attempt to refresh the token
        const validToken = await authService.getValidAccessToken();

        if (validToken) {
          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${validToken}`;
          // Retry the request
          return apiClient(originalRequest);
        } else {
          // Only logout if refresh token is actually expired
          if (import.meta.env.DEV) {
            console.log('No valid token available - checking if refresh token expired');
          }
          const { authService: authSvc } = await import('./services/auth');
          if (authSvc.isRefreshTokenExpired()) {
            authSvc.forceLogout();
          }
        }
      } catch (refreshError: any) {
        console.error('Token refresh failed during 401 retry:', refreshError);
        // Only force logout if it's an auth error, not network error
        if (refreshError.response?.status === 401 || refreshError.response?.status === 403) {
          const { authService } = await import('./services/auth');
          authService.forceLogout();
        }
      }
    }

    // Log other errors
    if (import.meta.env.DEV) {
      console.error('API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
      });
    }

    return Promise.reject(error);
  },
);

export default apiClient;
