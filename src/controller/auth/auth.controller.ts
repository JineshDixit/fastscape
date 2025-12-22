import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types/expressTypes';
import { 
  LoginRequest, 
  RegisterRequest, 
  RefreshTokenRequest 
} from '../../common/types/authTypes';
import * as authService from '../../services/auth/auth.service';
import { BaseController } from '../../utils/controller.utils';
import { sendSuccess, sendCreated } from '../../utils/response.utils';

class AuthController extends BaseController {
  /**
   * Register a new user
   */
  register = this.asyncHandler(async (req: Request, res: Response) => {
    const registerData = req.body as RegisterRequest;
    const result = await authService.registerUser(registerData);
    sendCreated(res, 'User registered successfully', result);
  });

  /**
   * Login user
   */
  login = this.asyncHandler(async (req: Request, res: Response) => {
    const loginData = req.body as LoginRequest;
    const result = await authService.loginUser(loginData);
    sendSuccess(res, 'Login successful', result);
  });

  /**
   * Refresh access token
   */
  refreshToken = this.asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as RefreshTokenRequest;
    const result = await authService.refreshAccessToken(refreshToken);
    sendSuccess(res, 'Tokens refreshed successfully', result);
  });

  /**
   * Logout user (revoke refresh token)
   */
  logout = this.asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as RefreshTokenRequest;
    await authService.logoutUser(refreshToken);
    sendSuccess(res, 'Logout successful');
  });

  /**
   * Logout from all devices (revoke all refresh tokens for user)
   */
  logoutAllDevices = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    await authService.logoutAllDevices(userId);
    sendSuccess(res, 'Logged out from all devices successfully');
  });
}

const authController = new AuthController();

export const {
  register,
  login,
  refreshToken,
  logout,
  logoutAllDevices
} = authController;