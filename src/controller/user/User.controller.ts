import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/expressTypes';
import * as userService from '../../services/user/user.service';
import { BaseController } from '../../utils/controller.utils';
import { sendSuccess } from '../../utils/response.utils';

class UserController extends BaseController {
  /**
   * Get current user profile
   */
  getCurrentUser = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const user = await userService.getUserById(userId);
    sendSuccess(res, 'Profile retrieved successfully', user);
  });

  /**
   * Update user profile
   */
  updateUserProfile = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const updateData = req.body;
    
    // Parse addresses if sent as JSON string (from FormData)
    if (typeof updateData.addresses === 'string') {
      try {
        updateData.addresses = JSON.parse(updateData.addresses);
      } catch (e) {
        // invalid json, ignore or let validation handle it
        updateData.addresses = [];
      }
    }

    const files = (req as any).files;
    const updatedUser = await userService.updateUser(userId, updateData, files);
    sendSuccess(res, 'Profile updated successfully', updatedUser);
  });

  /**
   * Delete user account
   */
  deleteUserAccount = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    await userService.deleteUser(userId);
    sendSuccess(res, 'Account deleted successfully');
  });

  /**
   * Get user statistics
   */
  getUserStats = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const stats = await userService.getUserStatistics(userId);
    sendSuccess(res, 'User statistics retrieved successfully', stats);
  });
}

const userController = new UserController();

export const { 
  getCurrentUser, 
  updateUserProfile, 
  deleteUserAccount, 
  getUserStats
} = userController;
