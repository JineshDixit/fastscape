import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types/expressTypes';
import { 
  LoginRequest, 
  RegisterRequest, 
  RefreshTokenRequest 
} from '../../common/types/authTypes';
import * as authService from '../../services/auth/auth.service';
import { createError } from '../../services/middleware/errorHandler';

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const registerData = req.body as RegisterRequest;
    const result = await authService.registerUser(registerData);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const loginData = req.body as LoginRequest;
    const result = await authService.loginUser(loginData);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body as RefreshTokenRequest;
    const result = await authService.refreshAccessToken(refreshToken);
    
    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user (revoke refresh token)
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body as RefreshTokenRequest;
    await authService.logoutUser(refreshToken);
    
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout from all devices (revoke all refresh tokens for user)
 */
export const logoutAllDevices = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw createError('Unauthorized', 401);
    }
    
    await authService.logoutAllDevices(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully',
    });
  } catch (error) {
    next(error);
  }
};