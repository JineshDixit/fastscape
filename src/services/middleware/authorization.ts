import { Response, NextFunction } from 'express';
import { createError } from './errorHandler';
import { AuthenticatedRequest } from '../../common/interfaces/authTypes';

/**
 * Helper to ensure user is authenticated and return user object
 */
const ensureAuthenticated = (req: AuthenticatedRequest) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }
  return req.user;
};

/**
 * Super access guard:
 * - active `super-admin` role
 * - OR explicit wildcard permission `admin:all`
 */
const hasSuperAccess = (user: ReturnType<typeof ensureAuthenticated>): boolean => {
  const hasSuperAdminRole =
    user.roles?.some((role) => role.isActive && role.name?.toLowerCase() === 'super-admin') || false;
  const hasAdminAllPermission = user.permissions?.includes('admin:all') || false;

  return hasSuperAdminRole || hasAdminAllPermission;
};

/**
 * Middleware to check if admin user has required role
 */
export const requireRole = (requiredRole: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = ensureAuthenticated(req);

      if (hasSuperAccess(user)) {
        return next();
      }

      if (!user.roles?.length) {
        throw createError('No roles assigned to user', 403);
      }

      const hasRole = user.roles.some((role) => role.name === requiredRole && role.isActive);

      if (!hasRole) {
        throw createError(`Access denied. Required role: ${requiredRole}`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if admin user has any of the required roles
 */
export const requireAnyRole = (requiredRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = ensureAuthenticated(req);

      if (hasSuperAccess(user)) {
        return next();
      }

      if (!user.roles?.length) {
        throw createError('No roles assigned to user', 403);
      }

      const hasAnyRole = user.roles.some((role) => requiredRoles.includes(role.name) && role.isActive);

      if (!hasAnyRole) {
        throw createError(`Access denied. Required roles: ${requiredRoles.join(', ')}`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if admin user has required permission
 */
export const requirePermission = (requiredPermission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = ensureAuthenticated(req);

      if (hasSuperAccess(user)) {
        return next();
      }

      if (!user.permissions?.length) {
        throw createError('No permissions assigned to user', 403);
      }

      if (!user.permissions.includes(requiredPermission)) {
        throw createError(`Access denied. Required permission: ${requiredPermission}`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if admin user has any of the required permissions
 */
export const requireAnyPermission = (requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = ensureAuthenticated(req);

      if (hasSuperAccess(user)) {
        return next();
      }

      if (!user.permissions?.length) {
        throw createError('No permissions assigned to user', 403);
      }

      const hasAnyPermission = requiredPermissions.some((permission) => user.permissions.includes(permission));

      if (!hasAnyPermission) {
        throw createError(`Access denied. Required permissions: ${requiredPermissions.join(', ')}`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if admin user has all required permissions
 */
export const requireAllPermissions = (requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = ensureAuthenticated(req);

      if (hasSuperAccess(user)) {
        return next();
      }

      if (!user.permissions?.length) {
        throw createError('No permissions assigned to user', 403);
      }

      const hasAllPermissions = requiredPermissions.every((permission) => user.permissions.includes(permission));

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter((permission) => !user.permissions.includes(permission));
        throw createError(`Access denied. Missing permissions: ${missingPermissions.join(', ')}`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if admin user can access their own resource or has admin privileges
 */
export const requireOwnershipOrRole = (roleForBypass: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = ensureAuthenticated(req);
      const targetUserId = req.params.id || req.params.adminUserId || req.body.adminUserId;

      // Allow if user is accessing their own resource or has bypass role
      if (
        user.userId === targetUserId ||
        hasSuperAccess(user) ||
        user.roles?.some((role) => role.name === roleForBypass && role.isActive)
      ) {
        return next();
      }

      throw createError('Access denied. You can only access your own resources or need admin privileges', 403);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if admin user is active
 */
export const requireActiveUser = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const user = ensureAuthenticated(req);

    if (!user.isActive) {
      throw createError('Account is inactive', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};
