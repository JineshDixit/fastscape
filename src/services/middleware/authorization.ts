import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

/**
 * Extended request interface with authenticated admin user
 */
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    isActive: boolean;
    roles: Array<{
      id: string;
      name: string;
      description: string;
      isActive: boolean;
    }>;
    permissions: string[];
  };
}

/**
 * Middleware to check if admin user has required role
 */
export const requireRole = (requiredRole: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        throw createError('Authentication required', 401);
      }

      if (!user.roles || user.roles.length === 0) {
        throw createError('No roles assigned to user', 403);
      }

      const hasRole = user.roles.some(role => 
        role.name === requiredRole && role.isActive
      );

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
      const user = req.user;

      if (!user) {
        throw createError('Authentication required', 401);
      }

      if (!user.roles || user.roles.length === 0) {
        throw createError('No roles assigned to user', 403);
      }

      const hasAnyRole = user.roles.some(role => 
        requiredRoles.includes(role.name) && role.isActive
      );

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
      const user = req.user;

      if (!user) {
        throw createError('Authentication required', 401);
      }

      if (!user.permissions || user.permissions.length === 0) {
        throw createError('No permissions assigned to user', 403);
      }

      const hasPermission = user.permissions.includes(requiredPermission);

      if (!hasPermission) {
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
      const user = req.user;

      if (!user) {
        throw createError('Authentication required', 401);
      }

      if (!user.permissions || user.permissions.length === 0) {
        throw createError('No permissions assigned to user', 403);
      }

      const hasAnyPermission = requiredPermissions.some(permission => 
        user.permissions.includes(permission)
      );

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
      const user = req.user;

      if (!user) {
        throw createError('Authentication required', 401);
      }

      if (!user.permissions || user.permissions.length === 0) {
        throw createError('No permissions assigned to user', 403);
      }

      const hasAllPermissions = requiredPermissions.every(permission => 
        user.permissions.includes(permission)
      );

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(permission => 
          !user.permissions.includes(permission)
        );
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
      const user = req.user;
      const targetUserId = req.params.id || req.params.adminUserId || req.body.adminUserId;

      if (!user) {
        throw createError('Authentication required', 401);
      }

      // Allow if user is accessing their own resource
      if (user.userId === targetUserId) {
        return next();
      }

      // Allow if user has the bypass role
      if (user.roles && user.roles.some(role => 
        role.name === roleForBypass && role.isActive
      )) {
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
    const user = req.user;

    if (!user) {
      throw createError('Authentication required', 401);
    }

    if (!user.isActive) {
      throw createError('Account is inactive', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};