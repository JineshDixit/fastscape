import type { CookieOptions } from '@/common/interface/cookieInterface';

/**
 * Set a cookie with options
 */
export const setCookie = (name: string, value: string, options: CookieOptions = {}): void => {
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.expires) {
    let expiresDate: Date;
    if (typeof options.expires === 'number') {
      // If number, treat as days from now
      expiresDate = new Date();
      expiresDate.setTime(expiresDate.getTime() + options.expires * 24 * 60 * 60 * 1000);
    } else {
      expiresDate = options.expires;
    }
    cookieString += `; expires=${expiresDate.toUTCString()}`;
  }

  // Handle maxAge (takes precedence over expires)
  if (options.maxAge) {
    cookieString += `; max-age=${options.maxAge}`;
  }

  // Handle path
  if (options.path) {
    cookieString += `; path=${options.path}`;
  } else {
    cookieString += `; path=/`; // Default to root path
  }

  // Handle domain
  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  // Handle secure
  if (options.secure) {
    cookieString += `; secure`;
  }

  // Handle sameSite
  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }

  document.cookie = cookieString;
};

/**
 * Get a cookie value by name
 */
export const getCookie = (name: string): string | null => {
  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    let c = cookie.trim();
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }

  return null;
};

/**
 * Delete a cookie
 */
export const deleteCookie = (name: string, path: string = '/', domain?: string): void => {
  let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  document.cookie = cookieString;
};

/**
 * Check if a cookie exists
 */
export const cookieExists = (name: string): boolean => {
  return getCookie(name) !== null;
};

/**
 * Get all cookies as an object
 */
export const getAllCookies = (): Record<string, string> => {
  const cookies: Record<string, string> = {};

  if (document.cookie) {
    document.cookie.split(';').forEach((cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value);
      }
    });
  }

  return cookies;
};

/**
 * Clear all cookies (for logout)
 */
export const clearAllCookies = (): void => {
  const cookies = getAllCookies();
  Object.keys(cookies).forEach((name) => {
    deleteCookie(name);
  });
};

// Specific cookie names for the application
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_EXPIRES_AT: 'token_expires_at',
  REFRESH_EXPIRES_AT: 'refresh_expires_at',
  REMEMBER_ME: 'remember_me',
} as const;

/**
 * Auth-specific cookie functions
 */
export const authCookies = {
  // Set access token with expiration
  setAccessToken: (token: string, expiresAt: string) => {
    const expiresDate = new Date(expiresAt);
    const isDevelopment = window.location.protocol === 'http:';
    
    setCookie(COOKIE_NAMES.ACCESS_TOKEN, token, {
      expires: expiresDate,
      secure: !isDevelopment, // Only secure in production (HTTPS)
      sameSite: isDevelopment ? 'lax' : 'strict', // More permissive in development
    });
    setCookie(COOKIE_NAMES.TOKEN_EXPIRES_AT, expiresAt, {
      expires: expiresDate,
      secure: !isDevelopment,
      sameSite: isDevelopment ? 'lax' : 'strict',
    });
  },

  // Set refresh token with expiration
  setRefreshToken: (token: string, expiresAt: string) => {
    const expiresDate = new Date(expiresAt);
    const isDevelopment = window.location.protocol === 'http:';
    
    setCookie(COOKIE_NAMES.REFRESH_TOKEN, token, {
      expires: expiresDate,
      secure: !isDevelopment, // Only secure in production (HTTPS)
      sameSite: isDevelopment ? 'lax' : 'strict', // More permissive in development
    });
    setCookie(COOKIE_NAMES.REFRESH_EXPIRES_AT, expiresAt, {
      expires: expiresDate,
      secure: !isDevelopment,
      sameSite: isDevelopment ? 'lax' : 'strict',
    });
  },

  // Set remember me
  setRememberMe: (remember: boolean) => {
    const isDevelopment = window.location.protocol === 'http:';
    
    if (remember) {
      setCookie(COOKIE_NAMES.REMEMBER_ME, 'true', {
        expires: 30, // 30 days
        secure: !isDevelopment,
        sameSite: isDevelopment ? 'lax' : 'strict',
      });
    } else {
      deleteCookie(COOKIE_NAMES.REMEMBER_ME);
    }
  },

  // Get functions
  getAccessToken: () => getCookie(COOKIE_NAMES.ACCESS_TOKEN),
  getRefreshToken: () => getCookie(COOKIE_NAMES.REFRESH_TOKEN),
  getTokenExpiresAt: () => getCookie(COOKIE_NAMES.TOKEN_EXPIRES_AT),
  getRefreshExpiresAt: () => getCookie(COOKIE_NAMES.REFRESH_EXPIRES_AT),
  getRememberMe: () => getCookie(COOKIE_NAMES.REMEMBER_ME) === 'true',

  // Clear all auth cookies
  clearAll: () => {
    Object.values(COOKIE_NAMES).forEach((cookieName) => {
      deleteCookie(cookieName);
    });
  },

  // Check if user is authenticated (simple check)
  isAuthenticated: () => {
    const accessToken = getCookie(COOKIE_NAMES.ACCESS_TOKEN);
    const refreshToken = getCookie(COOKIE_NAMES.REFRESH_TOKEN);
    const accessExpiresAt = getCookie(COOKIE_NAMES.TOKEN_EXPIRES_AT);
    const refreshExpiresAt = getCookie(COOKIE_NAMES.REFRESH_EXPIRES_AT);

    // If we have a valid access token, we are definitely authenticated
    if (accessToken && accessExpiresAt) {
      const now = Date.now();
      const expires = new Date(accessExpiresAt).getTime();
      if (now < expires) return true;
    }

    // If access token is missing/expired, but we have a valid refresh token,
    // we are still "authenticated" in the sense that we can recover the session.
    if (refreshToken && refreshExpiresAt) {
      const now = Date.now();
      const expires = new Date(refreshExpiresAt).getTime();
      return now < expires;
    }

    return false;
  },
};
