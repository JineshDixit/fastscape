import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types/expressTypes';
import * as userService from '../../services/user/user.service';
import { createError } from '../../services/middleware/errorHandler';

/**
 * Get current user profile
 */
export const getCurrentUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw createError('Unauthorized', 401);
    }
    
    const user = await userService.getUserById(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID (admin only)
 */
export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await userService.getUserById(userId);
    
    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw createError('Unauthorized', 401);
    }
    
    const updateData = req.body;
    const updatedUser = await userService.updateUser(req.user.id, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user account
 */
export const deleteUserAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw createError('Unauthorized', 401);
    }
    
    await userService.deleteUser(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

