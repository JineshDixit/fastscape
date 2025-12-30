import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

// API configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
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
    // Handle 401 errors by clearing tokens and redirecting
    const publicEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/forgot-password',
      '/auth/reset-password',
    ];
    const isPublicEndpoint = publicEndpoints.some((endpoint) => error.config?.url?.includes(endpoint));

    if (error.response?.status === 401 && !isPublicEndpoint) {
      console.error('401 Unauthorized - Clearing tokens');

      // Import authService here to avoid circular dependency
      const { authService } = await import('./services/auth');
      authService.clearTokens();

      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
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
