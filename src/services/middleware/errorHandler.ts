import { AppError } from '../../common/types/errorType';
import '../../config/env/envConfig';
import { Request, Response, NextFunction } from 'express';
import Logger from '../../utils/logger';

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let { statusCode = 500, message } = error;

  // If status code is 500, change message to generic error for production users
  if (
    statusCode === 500 &&
    process.env.NODE_ENV === 'production' &&
    !error.isOperational
  ) {
    message = 'Something went wrong on the server';
  }

  // Log error using Logger
  Logger.error('Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

/**
 * Create operational error
 */
export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
