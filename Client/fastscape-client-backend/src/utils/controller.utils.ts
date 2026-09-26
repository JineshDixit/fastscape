import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../common/types/expressTypes';
import { createError } from '../services/middleware/errorHandler';
import { sendSuccess, sendCreated, sendSuccessWithPagination } from './response.utils';
import { validateUUID } from './validation.utils';

/**
 * Base controller class with common functionality
 */
export abstract class BaseController {
  /**
   * Ensure user is authenticated
   */
  protected ensureAuthenticated(req: AuthenticatedRequest): string {
    if (!req.user?.id) {
      throw createError('Unauthorized', 401);
    }
    return req.user.id;
  }

  /**
   * Get and validate UUID parameter
   */
  protected getValidatedId(req: Request, paramName: string): string {
    const id = req.params[paramName];
    validateUUID(id, paramName);
    return id;
  }

  /**
   * Async handler wrapper to catch errors
   */
  protected asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  /**
   * Standard CRUD operations
   */
  protected handleGetById = <T>(
    service: (id: string, userId?: string) => Promise<T>,
    message: string,
    requireAuth: boolean = false,
  ) => {
    return this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const id = this.getValidatedId(req, Object.keys(req.params)[0]);
      const userId = requireAuth ? this.ensureAuthenticated(req) : undefined;

      const result = await service(id, userId);
      sendSuccess(res, message, result);
    });
  };

  protected handleGetList = <T>(
    service: (filters: any, userId?: string) => Promise<T[]>,
    message: string,
    requireAuth: boolean = false,
  ) => {
    return this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const userId = requireAuth ? this.ensureAuthenticated(req) : undefined;
      const filters = req.query;

      const results = await service(filters, userId);
      sendSuccess(res, message, results);
    });
  };

  protected handleGetListWithPagination = <T>(
    service: (filters: any, pagination: any, userId?: string) => Promise<{ items: T[]; total: number }>,
    message: string,
    requireAuth: boolean = false,
  ) => {
    return this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const userId = requireAuth ? this.ensureAuthenticated(req) : undefined;
      const { page = 1, limit = 20, ...filters } = req.query;

      const pagination = {
        page: Math.max(1, parseInt(page as string) || 1),
        limit: Math.min(100, Math.max(1, parseInt(limit as string) || 20)),
      };

      const { items, total } = await service(filters, pagination, userId);

      sendSuccessWithPagination(res, message, items, {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      });
    });
  };

  protected handleCreate = <T, D>(
    service: (data: D, userId?: string) => Promise<T>,
    message: string,
    requireAuth: boolean = true,
  ) => {
    return this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const userId = requireAuth ? this.ensureAuthenticated(req) : undefined;
      const data = req.body;

      const result = await service(data, userId);
      sendCreated(res, message, result);
    });
  };

  protected handleUpdate = <T, D>(
    service: (id: string, data: D, userId?: string) => Promise<T>,
    message: string,
    requireAuth: boolean = true,
  ) => {
    return this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const id = this.getValidatedId(req, Object.keys(req.params)[0]);
      const userId = requireAuth ? this.ensureAuthenticated(req) : undefined;
      const data = req.body;

      const result = await service(id, data, userId);
      sendSuccess(res, message, result);
    });
  };

  protected handleDelete = (
    service: (id: string, userId?: string) => Promise<void>,
    message: string,
    requireAuth: boolean = true,
  ) => {
    return this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const id = this.getValidatedId(req, Object.keys(req.params)[0]);
      const userId = requireAuth ? this.ensureAuthenticated(req) : undefined;

      await service(id, userId);
      sendSuccess(res, message);
    });
  };
}
