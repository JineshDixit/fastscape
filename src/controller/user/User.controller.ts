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
   * Get user by ID (admin only)
   */
  getUserById = this.handleGetById(
    userService.getUserById,
    'User retrieved successfully',
    false
  );

  /**
   * Update user profile
   */
  updateUserProfile = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const updateData = req.body;
    const updatedUser = await userService.updateUser(userId, updateData);
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
}

const userController = new UserController();

export const {
  getCurrentUser,
  getUserById,
  updateUserProfile,
  deleteUserAccount
} = userController;

