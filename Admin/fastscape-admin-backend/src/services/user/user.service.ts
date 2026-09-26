import { Op } from 'sequelize';
import { User, UserDrivingInfo, UserIdentityDocument, Booking, sequelize } from '../../models';
import logger from '../../config/logger';

interface UserFilters {
  verificationStatus?: string;
  isBlocked?: boolean;
  country?: string;
  city?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface UserListResult {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get all users with filtering and pagination
 */
export const getAllUsers = async (filters: UserFilters): Promise<UserListResult> => {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 100);
  const offset = (page - 1) * limit;

  const where: any = {};

  if (filters.verificationStatus) {
    where.verificationStatus = filters.verificationStatus;
  }

  if (filters.isBlocked !== undefined) {
    where.isBlocked = filters.isBlocked;
  }

  if (filters.country) {
    where.country = filters.country;
  }

  if (filters.city) {
    where.city = filters.city;
  }

  // Server-side search logic
  if (filters.search) {
    const searchCondition = {
      [Op.or]: [
        { id: { [Op.iLike]: `%${filters.search}%` } },
        { firstName: { [Op.iLike]: `%${filters.search}%` } },
        { lastName: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } },
        { phone: { [Op.iLike]: `%${filters.search}%` } },
      ],
    };
    Object.assign(where, searchCondition);
  }

  // Sorting logic
  let order: any = [['createdAt', 'DESC']];
  if (filters.sortBy) {
    const sortOrder = filters.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    order = [[filters.sortBy, sortOrder]];
  }

  const { rows: users, count: total } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['passwordHash', 'resetPasswordOtp', 'resetPasswordOtpExpires'] },
    include: [
      {
        model: UserDrivingInfo,
        required: false,
      },
      {
        model: UserIdentityDocument,
        required: false,
        attributes: {
          exclude: [
            'driverLicenseFront',
            'driverLicenseBack',
            'passportPhoto',
            'internationalDrivingPermit',
            'selfieWithLicense',
          ],
        },
      },
    ],
    order,
    limit,
    offset,
    distinct: true,
  });

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single user by ID with full details
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  return await User.findByPk(userId, {
    attributes: { exclude: ['passwordHash', 'resetPasswordOtp', 'resetPasswordOtpExpires'] },
    include: [
      {
        model: UserDrivingInfo,
        required: false,
      },
      {
        model: UserIdentityDocument,
        required: false,
      },
      {
        model: Booking,
        required: false,
        limit: 10,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'bookingStatus', 'paymentStatus', 'bookingType', 'startDatetime', 'createdAt'],
      },
    ],
  });
};

/**
 * Update user verification status
 */
export const updateVerificationStatus = async (userId: string, verificationStatus: string): Promise<User> => {
  const startTime = Date.now();
  logger.info('Updating user verification status', { userId, verificationStatus });

  const transaction = await sequelize.transaction();

  try {
    const user = await User.findByPk(userId, {
      transaction,
      lock: true,
    });

    if (!user) {
      logger.error('User not found for verification status update', { userId });
      throw new Error('User not found');
    }

    await user.update(
      {
        verificationStatus,
        verificationDate: verificationStatus === 'VERIFIED' ? new Date() : null,
      },
      { transaction },
    );

    // Also update identity document verification status if exists
    const identityDoc = await UserIdentityDocument.findOne({
      where: { userId },
      transaction,
    });

    if (identityDoc) {
      await identityDoc.update(
        {
          verificationStatus,
          verificationDate: verificationStatus === 'VERIFIED' ? new Date() : null,
          verified: verificationStatus === 'VERIFIED',
        },
        { transaction },
      );
    }

    await transaction.commit();

    const duration = Date.now() - startTime;
    logger.info('User verification status updated successfully', {
      userId,
      verificationStatus,
      duration: `${duration}ms`,
    });

    return user;
  } catch (error) {
    await transaction.rollback();
    logger.error('Failed to update user verification status, transaction rolled back', {
      userId,
      verificationStatus,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

/**
 * Block or unblock a user
 */
export const toggleBlockUser = async (userId: string, isBlocked: boolean, reason?: string): Promise<User> => {
  const startTime = Date.now();
  logger.info('Toggling user block status', { userId, isBlocked, reason });

  const transaction = await sequelize.transaction();

  try {
    const user = await User.findByPk(userId, {
      transaction,
      lock: true,
    });

    if (!user) {
      logger.error('User not found for block status update', { userId });
      throw new Error('User not found');
    }

    await user.update({ isBlocked }, { transaction });

    // If blocking user, cancel all their pending bookings
    if (isBlocked) {
      logger.debug('Cancelling pending bookings for blocked user', { userId });

      await Booking.update(
        {
          bookingStatus: 'CANCELLED',
          notes: sequelize.literal(
            `CONCAT(COALESCE(notes, ''), '\nCancelled: User blocked${reason ? ` - ${reason}` : ''}')`,
          ),
        },
        {
          where: {
            userId,
            bookingStatus: { [Op.in]: ['PENDING', 'CONFIRMED'] },
          },
          transaction,
        },
      );
    }

    await transaction.commit();

    const duration = Date.now() - startTime;
    logger.info('User block status updated successfully', {
      userId,
      isBlocked,
      duration: `${duration}ms`,
    });

    return user;
  } catch (error) {
    await transaction.rollback();
    logger.error('Failed to update user block status, transaction rolled back', {
      userId,
      isBlocked,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

/**
 * Export users to CSV with filters
 */
export const exportUsersToCSV = async (filters: UserFilters): Promise<User[]> => {
  const where: any = {};

  if (filters.verificationStatus) {
    where.verificationStatus = filters.verificationStatus;
  }

  if (filters.isBlocked !== undefined) {
    where.isBlocked = filters.isBlocked;
  }

  if (filters.country) {
    where.country = filters.country;
  }

  if (filters.city) {
    where.city = filters.city;
  }

  if (filters.search) {
    const searchCondition = {
      [Op.or]: [
        { id: { [Op.iLike]: `%${filters.search}%` } },
        { firstName: { [Op.iLike]: `%${filters.search}%` } },
        { lastName: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } },
        { phone: { [Op.iLike]: `%${filters.search}%` } },
      ],
    };
    Object.assign(where, searchCondition);
  }

  const users = await User.findAll({
    where,
    attributes: { exclude: ['passwordHash', 'resetPasswordOtp', 'resetPasswordOtpExpires'] },
    order: [['createdAt', 'DESC']],
    limit: 5000,
  });

  return users;
};
