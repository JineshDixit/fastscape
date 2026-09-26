import { Request, Response } from 'express';
import * as userService from '../../services/user/user.service';

/**
 * GET /api/users
 * Get all users with filters and pagination
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const filters = {
      verificationStatus: req.query.verificationStatus as string,
      isBlocked: req.query.isBlocked === 'true' ? true : req.query.isBlocked === 'false' ? false : undefined,
      country: req.query.country as string,
      city: req.query.city as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: (req.query.sortOrder as string) || 'DESC',
    };

    const result = await userService.getAllUsers(filters);

    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch users',
        code: 'USER_FETCH_ERROR',
      },
    });
  }
};

/**
 * GET /api/users/:id
 * Get single user details
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch user',
        code: 'USER_FETCH_ERROR',
      },
    });
  }
};

/**
 * PUT /api/users/:id/verification-status
 * Update user verification status
 */
export const updateVerificationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { verificationStatus } = req.body;

    if (!verificationStatus) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'verificationStatus is required',
          code: 'MISSING_STATUS',
        },
      });
    }

    const validStatuses = ['PENDING', 'VERIFIED', 'REJECTED'];
    if (!validStatuses.includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS',
        },
      });
    }

    const user = await userService.updateVerificationStatus(id, verificationStatus);

    res.status(200).json({
      success: true,
      data: user,
      message: `User verification status updated to ${verificationStatus}`,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to update verification status',
        code: 'STATUS_UPDATE_ERROR',
      },
    });
  }
};

/**
 * PUT /api/users/:id/block
 * Block or unblock a user
 */
export const toggleBlockUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isBlocked, reason } = req.body;

    if (typeof isBlocked !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'isBlocked must be a boolean value',
          code: 'INVALID_BLOCK_STATUS',
        },
      });
    }

    const user = await userService.toggleBlockUser(id, isBlocked, reason);

    res.status(200).json({
      success: true,
      data: user,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to update block status',
        code: 'BLOCK_UPDATE_ERROR',
      },
    });
  }
};

/**
 * GET /api/users/export
 * Export users (clients) to CSV with filters
 */
export const exportUsers = async (req: Request, res: Response) => {
  try {
    const { CSVExportService } = await import('../../services/csv/csvExport.service');

    const filters = {
      verificationStatus: req.query.verificationStatus as string,
      isBlocked: req.query.isBlocked === 'true' ? true : req.query.isBlocked === 'false' ? false : undefined,
      country: req.query.country as string,
      city: req.query.city as string,
      search: req.query.search as string,
    };

    const users = await userService.exportUsersToCSV(filters);

    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'verificationStatus', label: 'Verification Status' },
      {
        key: 'isBlocked',
        label: 'Blocked',
        format: CSVExportService.formatBoolean,
      },
      {
        key: 'dateOfBirth',
        label: 'Date of Birth',
        format: CSVExportService.formatDate,
      },
      { key: 'nationality', label: 'Nationality' },
      { key: 'city', label: 'City' },
      { key: 'country', label: 'Country' },
      { key: 'address', label: 'Address' },
      {
        key: 'createdAt',
        label: 'Created At',
        format: CSVExportService.formatDateTime,
      },
    ];

    const csv = CSVExportService.generateCSV(users, columns);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=clients-${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to export clients',
        code: 'EXPORT_ERROR',
      },
    });
  }
};
