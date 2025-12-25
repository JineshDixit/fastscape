import { Request, Response, NextFunction } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  logoutFromAllDevices,
  getCurrentProfile,
} from '../../services/auth/auth.service';
import { sendSuccess, sendCreated } from '../../utils/response.utils';
import { createError } from '../../services/middleware/errorHandler';

/**
 * Register a new admin user
 */
export const registerAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const deviceInfo = req.get('User-Agent');
    const ipAddress = req.ip;

    const result = await register(
      { firstName, lastName, email, password },
      deviceInfo,
      ipAddress
    );

    sendCreated(res, 'Admin user registered successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Login admin user
 */
export const loginAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const deviceInfo = req.get('User-Agent');
    const ipAddress = req.ip;

    const result = await login(
      { email, password },
      deviceInfo,
      ipAddress
    );

    sendSuccess(res, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      throw createError('Refresh token is required', 400);
    }

    const result = await refreshToken(token);

    sendSuccess(res, 'Token refreshed successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Logout admin user
 */
export const logoutAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw createError('Refresh token is required', 400);
    }

    await logout(refreshToken);

    sendSuccess(res, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Logout from all devices
 */
export const logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUserId = (req as any).user?.userId;

    if (!adminUserId) {
      throw createError('Admin user ID not found', 401);
    }

    await logoutFromAllDevices(adminUserId);

    sendSuccess(res, 'Logged out from all devices successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin user profile
 */
export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUserId = (req as any).user?.userId;

    if (!adminUserId) {
      throw createError('Admin user ID not found', 401);
    }

    const result = await getCurrentProfile(adminUserId);

    sendSuccess(res, 'Profile retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};