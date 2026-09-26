import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

// Validation middleware to check for validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Login validation rules
export const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),

  body('password').notEmpty().withMessage('Password is required'),

  handleValidationErrors,
];

// Refresh token validation rules
export const validateRefreshToken = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),

  handleValidationErrors,
];
