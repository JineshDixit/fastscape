import { AppError } from '../../common/types/errorType';
import '../../config/env/envConfig';
import { Request, Response, NextFunction } from 'express';
import Logger from '../../utils/logger';

/**
 * Handle Sequelize validation errors
 */
const handleSequelizeError = (error: any): AppError => {
  if (error.name === 'SequelizeValidationError') {
    const messages = error.errors.map((err: any) => err.message);
    return createError(`Validation error: ${messages.join(', ')}`, 400, 'VALIDATION_ERROR');
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors[0]?.path || 'field';
    return createError(`${field} already exists`, 409, 'DUPLICATE_ERROR');
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return createError('Referenced record does not exist', 400, 'FOREIGN_KEY_ERROR');
  }

  if (error.name === 'SequelizeOptimisticLockError') {
    return createError(
      'Record was modified by another user. Please refresh and try again.',
      409,
      'OPTIMISTIC_LOCK_ERROR',
    );
  }

  if (error.name === 'SequelizeTimeoutError') {
    return createError('Database operation timed out', 408, 'TIMEOUT_ERROR');
  }

  return createError('Database error occurred', 500, 'DATABASE_ERROR', error.message);
};

/**
 * Handle JWT errors
 */
const handleJWTError = (error: any): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return createError('Invalid token', 401, 'INVALID_TOKEN');
  }

  if (error.name === 'TokenExpiredError') {
    return createError('Token expired', 401, 'TOKEN_EXPIRED');
  }

  return createError('Authentication error', 401, 'AUTH_ERROR');
};

/**
 * Global error handling middleware
 */
export const errorHandler = (error: AppError, req: Request, res: Response, next: NextFunction): void => {
  let processedError: AppError;

  // Handle different types of errors
  if (error.name?.startsWith('Sequelize')) {
    processedError = handleSequelizeError(error);
  } else if (error.name?.includes('JsonWebToken') || error.name === 'TokenExpiredError') {
    processedError = handleJWTError(error);
  } else if (error.isOperational) {
    processedError = error;
  } else {
    // Unhandled error
    processedError = createError('Internal server error', 500, 'INTERNAL_ERROR');
  }

  let { statusCode = 500, message } = processedError;

  // If status code is 500, change message to generic error for production users
  if (statusCode === 500 && process.env.NODE_ENV === 'production' && !processedError.isOperational) {
    message = 'Something went wrong on the server';
  }

  // Log error details
  const errorLog = {
    message: processedError.message,
    statusCode: processedError.statusCode,
    code: processedError.code,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString(),
  };

  if (statusCode >= 500) {
    Logger.error('Server error occurred', errorLog);
  } else {
    Logger.warn('Client error occurred', errorLog);
  }

  // Send error response
  const response: any = {
    success: false,
    message,
    code: processedError.code,
  };

  // Include details in development
  if (process.env.NODE_ENV === 'development') {
    response.details = processedError.details;
    response.stack = error.stack;
  }

  // Include error ID for tracking
  response.errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  res.status(statusCode).json(response);
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    code: 'NOT_FOUND',
  });
};

/**
 * Create operational error
 */
export const createError = (message: string, statusCode: number = 500, code?: string, details?: any): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  error.code = code;
  error.details = details;
  return error;
};
