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
    const files = (req as any).files;
    const updatedUser = await userService.updateUser(userId, updateData, files);
    sendSuccess(res, 'Profile updated successfully', updatedUser);
  });

}

const userController = new UserController();

export const { getCurrentUser, updateUserProfile } = userController;
