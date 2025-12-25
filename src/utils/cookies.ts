import type { CookieOptions } from "@/common/interface/cookieInterface";

/**
 * Set a cookie with options
 */
export const setCookie = (
  name: string, 
  value: string, 
  options: CookieOptions = {}
): void => {
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.expires) {
    let expiresDate: Date;
    if (typeof options.expires === 'number') {
      // If number, treat as days from now
      expiresDate = new Date();
      expiresDate.setTime(expiresDate.getTime() + (options.expires * 24 * 60 * 60 * 1000));
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
export const deleteCookie = (
  name: string, 
  path: string = '/', 
  domain?: string
): void => {
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
    document.cookie.split(';').forEach(cookie => {
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
  Object.keys(cookies).forEach(name => {
    deleteCookie(name);
  });
};

// Specific cookie names for the application
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  USER_PERMISSIONS: 'user_permissions',
  USER_ROLES: 'user_roles',
  TOKEN_EXPIRES_AT: 'token_expires_at',
  REFRESH_EXPIRES_AT: 'refresh_expires_at',
  REMEMBER_ME: 'remember_me'
} as const;

/**
 * Auth-specific cookie functions
 */
export const authCookies = {
  // Set access token with expiration
  setAccessToken: (token: string, expiresAt: string) => {
    const expiresDate = new Date(expiresAt);
    setCookie(COOKIE_NAMES.ACCESS_TOKEN, token, {
      expires: expiresDate,
      secure: true,
      sameSite: 'strict'
    });
    setCookie(COOKIE_NAMES.TOKEN_EXPIRES_AT, expiresAt, {
      expires: expiresDate,
      secure: true,
      sameSite: 'strict'
    });
  },

  // Set refresh token with expiration
  setRefreshToken: (token: string, expiresAt: string) => {
    const expiresDate = new Date(expiresAt);
    setCookie(COOKIE_NAMES.REFRESH_TOKEN, token, {
      expires: expiresDate,
      secure: true,
      sameSite: 'strict'
    });
    setCookie(COOKIE_NAMES.REFRESH_EXPIRES_AT, expiresAt, {
      expires: expiresDate,
      secure: true,
      sameSite: 'strict'
    });
  },

  // Set user data
  setUserData: (userData: any) => {
    setCookie(COOKIE_NAMES.USER_DATA, JSON.stringify(userData), {
      expires: 7, // 7 days
      secure: true,
      sameSite: 'strict'
    });
  },

  // Set user permissions
  setUserPermissions: (permissions: string[]) => {
    setCookie(COOKIE_NAMES.USER_PERMISSIONS, JSON.stringify(permissions), {
      expires: 7, // 7 days
      secure: true,
      sameSite: 'strict'
    });
  },

  // Set user roles
  setUserRoles: (roles: any[]) => {
    setCookie(COOKIE_NAMES.USER_ROLES, JSON.stringify(roles), {
      expires: 7, // 7 days
      secure: true,
      sameSite: 'strict'
    });
  },

  // Set remember me
  setRememberMe: (remember: boolean) => {
    if (remember) {
      setCookie(COOKIE_NAMES.REMEMBER_ME, 'true', {
        expires: 30, // 30 days
        secure: true,
        sameSite: 'strict'
      });
    } else {
      deleteCookie(COOKIE_NAMES.REMEMBER_ME);
    }
  },

  // Get functions
  getAccessToken: () => getCookie(COOKIE_NAMES.ACCESS_TOKEN),
  getRefreshToken: () => getCookie(COOKIE_NAMES.REFRESH_TOKEN),
  getUserData: () => {
    const data = getCookie(COOKIE_NAMES.USER_DATA);
    return data ? JSON.parse(data) : null;
  },
  getUserPermissions: () => {
    const permissions = getCookie(COOKIE_NAMES.USER_PERMISSIONS);
    return permissions ? JSON.parse(permissions) : [];
  },
  getUserRoles: () => {
    const roles = getCookie(COOKIE_NAMES.USER_ROLES);
    return roles ? JSON.parse(roles) : [];
  },
  getTokenExpiresAt: () => getCookie(COOKIE_NAMES.TOKEN_EXPIRES_AT),
  getRefreshExpiresAt: () => getCookie(COOKIE_NAMES.REFRESH_EXPIRES_AT),
  getRememberMe: () => getCookie(COOKIE_NAMES.REMEMBER_ME) === 'true',

  // Clear all auth cookies
  clearAll: () => {
    Object.values(COOKIE_NAMES).forEach(cookieName => {
      deleteCookie(cookieName);
    });
  },

  // Check if user is authenticated (simple check)
  isAuthenticated: () => {
    const token = getCookie(COOKIE_NAMES.ACCESS_TOKEN);
    const expiresAt = getCookie(COOKIE_NAMES.TOKEN_EXPIRES_AT);
    
    if (!token || !expiresAt) return false;
    
    // Simple expiry check
    const now = new Date().getTime();
    const expires = new Date(expiresAt).getTime();
    
    return now < expires;
  }
};