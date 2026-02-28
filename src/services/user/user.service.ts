import { User, RefreshToken, UserDrivingInfo, UserIdentityDocument } from '../../models';
import { saveFile } from '../../utils/file.utils';
import { userModelType, LocationSearchQuery, UserLocationData, UserWithLocation } from '../../common/types/userTypes';
import { createError } from '../middleware/errorHandler';
import { hashPassword } from '../../utils/password.utils';
import { sanitizeEmail } from '../../utils/security.utils';
import { validateRequiredFields, validateEmail } from '../../utils/validation.utils';
import { USER_SAFE_ATTRIBUTES } from '../../utils/database.utils';
import { Op } from 'sequelize';
import Logger from '../../utils/logger';
import { verificationConfig, canUserBook } from '../../config/verification/verificationConfig';

/**
 * Validate and normalize address data
 */
export const validateAndNormalizeAddress = (data: Partial<userModelType>) => {
  if (data.city) data.city = data.city.trim();
  if (data.state) data.state = data.state.trim();
  if (data.zipCode) data.zipCode = data.zipCode.trim().toUpperCase();
  if (data.country) data.country = data.country.trim();
};

/**
 * Helper function to determine address completeness
 */
function getAddressCompleteness(user: User): 'COMPLETE' | 'PARTIAL' | 'MISSING' {
  const hasCity = !!user.city;
  const hasState = !!user.state;
  const hasCountry = !!user.country;

  if (hasCity && hasState && hasCountry) {
    return 'COMPLETE';
  } else if (hasCity || hasState || hasCountry) {
    return 'PARTIAL';
  } else {
    return 'MISSING';
  }
}

/**
 * Retrieves a user by ID (excluding password hash)
 */
export const getUserById = async (userId: string): Promise<Partial<User>> => {
  if (!userId) {
    throw createError('User ID is required', 400);
  }

  const user = await User.findByPk(userId, {
    attributes: USER_SAFE_ATTRIBUTES,
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  return user.toJSON();
};

/**
 * Retrieves complete user profile including driving info and documents
 */
export const getUserProfile = async (userId: string): Promise<any> => {
  if (!userId) {
    throw createError('User ID is required', 400);
  }

  const user = await User.findByPk(userId, {
    attributes: USER_SAFE_ATTRIBUTES,
    include: [
      {
        model: UserDrivingInfo,
        as: 'drivingInfo',
        required: false,
      },
      {
        model: UserIdentityDocument,
        as: 'identityDocument',
        required: false,
      },
    ],
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  const userJson = user.toJSON() as any;

  // Flatten the structure for frontend compatibility
  if (userJson.drivingInfo) {
    userJson.licenseIssuingCountry = userJson.drivingInfo.licenseIssuingCountry;
    userJson.licenseExpiryDate = userJson.drivingInfo.licenseExpiryDate;
    userJson.drivingExperienceYears = userJson.drivingInfo.drivingExperienceYears;
    userJson.visaStatus = userJson.drivingInfo.visaStatus;
  }

  if (userJson.identityDocument) {
    userJson.driverLicenseFront = userJson.identityDocument.driverLicenseFront;
    userJson.driverLicenseBack = userJson.identityDocument.driverLicenseBack;
    userJson.passportPhoto = userJson.identityDocument.passportPhoto;
    userJson.internationalDrivingPermit = userJson.identityDocument.internationalDrivingPermit;
    userJson.selfieWithLicense = userJson.identityDocument.selfieWithLicense;
    userJson.documentVerificationStatus = userJson.identityDocument.verificationStatus;
    userJson.documentVerified = userJson.identityDocument.verified;
  }

  // Clean up nested objects
  delete userJson.drivingInfo;
  delete userJson.identityDocument;

  return userJson;
};

/**
 * Retrieves a user by email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  if (!email) {
    throw createError('Email is required', 400);
  }

  const sanitizedEmail = sanitizeEmail(email);
  return await User.findOne({ where: { email: sanitizedEmail } });
};

/**
 * Updates a user by ID with the provided data, including driving info and documents
 */
export const updateUser = async (
  userId: string,
  updateData: Partial<userModelType> & any,
  files?: { [fieldname: string]: Express.Multer.File[] },
): Promise<Partial<User>> => {
  if (!userId) {
    throw createError('User ID is required', 400);
  }

  // Find user first
  const user = await User.findByPk(userId);
  if (!user) {
    throw createError('User not found', 404);
  }

  // Sanitize and validate email if provided
  if (updateData.email) {
    validateEmail(updateData.email);
    updateData.email = sanitizeEmail(updateData.email);

    // Check if email is already taken by another user
    const existingUser = await User.findOne({
      where: {
        email: updateData.email,
        id: { [Op.ne]: userId },
      },
    });

    if (existingUser) {
      throw createError('Email is already taken', 409);
    }
  }

  // Normalize address fields if present
  validateAndNormalizeAddress(updateData);

  // Hash password if provided
  if (updateData.passwordHash) {
    updateData.passwordHash = await hashPassword(updateData.passwordHash);
  }

  // Remove sensitive fields that shouldn't be updated directly
  const { id, ...safeUpdateData } = updateData;

  // Transaction for atomic updates
  const transaction = await User.sequelize!.transaction();

  try {
    Logger.info('Initiating user profile update', { userId });

    // 1. Update User basic info
    await user.update(safeUpdateData, { transaction });

    // 2. Update Driving Info
    if (
      updateData.licenseIssuingCountry ||
      updateData.licenseExpiryDate ||
      updateData.drivingExperienceYears ||
      updateData.visaStatus
    ) {
      Logger.info('Updating user driving information', { userId });

      const drivingInfoData = {
        userId,
        licenseIssuingCountry: updateData.licenseIssuingCountry,
        licenseExpiryDate: updateData.licenseExpiryDate,
        drivingExperienceYears: updateData.drivingExperienceYears,
        visaStatus: updateData.visaStatus,
      };

      // Upsert driving info
      const existingDrivingInfo = await UserDrivingInfo.findOne({ where: { userId }, transaction });
      if (existingDrivingInfo) {
        await existingDrivingInfo.update(drivingInfoData, { transaction });
      } else {
        await UserDrivingInfo.create(drivingInfoData, { transaction });
      }
    }

    // 3. Update Identity Documents (if files provided)
    if (files && Object.keys(files).length > 0) {
      Logger.info('Processing user document uploads', { userId, fileCount: Object.keys(files).length });

      const documentUpdates: any = {
        verificationStatus: 'PENDING', // Reset verification when new docs arrive
        verified: false,
      };

      // Helper to process file
      const processFile = async (fieldName: string) => {
        if (files[fieldName] && files[fieldName][0]) {
          const relativePath = await saveFile(files[fieldName][0], userId, fieldName);
          documentUpdates[fieldName] = relativePath;
        }
      };

      await processFile('driverLicenseFront');
      await processFile('driverLicenseBack');
      await processFile('passportPhoto');
      await processFile('internationalDrivingPermit');
      await processFile('selfieWithLicense');

      if (Object.keys(documentUpdates).length > 2) {
        // More than just status/verified
        // Upsert identity documents
        const existingDocs = await UserIdentityDocument.findOne({ where: { userId }, transaction });

        // Check if auto-verification is enabled
        const shouldAutoVerify = verificationConfig.autoVerifyDocuments;

        if (shouldAutoVerify) {
          Logger.info('Auto-verifying documents (enabled in config)', { userId });
          documentUpdates.verificationStatus = 'VERIFIED';
          documentUpdates.verified = true;
          await user.update({ verificationStatus: 'VERIFIED' }, { transaction });
        } else {
          Logger.info('Documents uploaded - pending manual verification', { userId });
          // Keep as PENDING - admin will verify later
        }

        if (existingDocs) {
          await existingDocs.update(documentUpdates, { transaction });
        } else {
          await UserIdentityDocument.create({ userId, ...documentUpdates }, { transaction });
        }

        Logger.info(`User documents updated ${shouldAutoVerify ? 'and AUTO-VERIFIED' : '- PENDING verification'}`, {
          userId,
        });
      }
    }

    await transaction.commit();
    Logger.info('User profile update completed successfully', { userId });

    // Return updated user without password
    const finalUser = await User.findByPk(userId, {
      attributes: USER_SAFE_ATTRIBUTES,
    });

    return finalUser!.toJSON();
  } catch (error: any) {
    await transaction.rollback();
    Logger.error('Error updating user profile', { userId, error: error.message });
    throw error;
  }
};

/**
 * Deletes a user by ID
 */
export const deleteUser = async (userId: string): Promise<void> => {
  if (!userId) {
    throw createError('User ID is required', 400);
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw createError('User not found', 404);
  }

  // Revoke all refresh tokens before deleting user
  await RefreshToken.update({ isRevoked: true }, { where: { userId, isRevoked: false } });

  // Delete user
  await user.destroy();
};

/**
 * Creates a new user
 */
export const createUser = async (userData: userModelType): Promise<Partial<User>> => {
  const { firstName, lastName, dateOfBirth, nationality, email: rawEmail, phone, passwordHash } = userData;

  // Validate required fields
  validateRequiredFields(userData, [
    'firstName',
    'lastName',
    'dateOfBirth',
    'nationality',
    'email',
    'phone',
    'passwordHash',
  ]);

  const email = sanitizeEmail(rawEmail);
  validateEmail(email);

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw createError('User with this email already exists', 409);
  }

  // Hash password
  const hashedPassword = await hashPassword(passwordHash);

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    dateOfBirth: new Date(dateOfBirth),
    nationality,
    email,
    phone,
    passwordHash: hashedPassword,
    isBlocked: false,
  });

  // Return user without password
  const { passwordHash: _, ...userWithoutPassword } = user.toJSON();
  return userWithoutPassword;
};

/**
 * Get users by location
 */
export const getUsersByLocation = async (query: LocationSearchQuery): Promise<UserWithLocation[]> => {
  const { city, state, country } = query;

  const whereConditions: any = {
    isBlocked: false,
  };

  if (city) {
    whereConditions.city = { [Op.iLike]: `%${city}%` };
  }

  if (state) {
    whereConditions.state = { [Op.iLike]: `%${state}%` };
  }

  if (country) {
    whereConditions.country = { [Op.iLike]: `%${country}%` };
  }

  const users = await User.findAll({
    where: whereConditions,
    attributes: [
      'id',
      'firstName',
      'lastName',
      'email',
      'phone',
      'city',
      'state',
      'zipCode',
      'country',
      'nationality',
      'createdAt',
    ],
    order: [
      ['firstName', 'ASC'],
      ['lastName', 'ASC'],
    ],
  });

  return users.map((user) => ({
    ...user.toJSON(),
    locationSummary: [user.city, user.state, user.country].filter(Boolean).join(', '),
    addressCompleteness: getAddressCompleteness(user),
  }));
};

/**
 * Get location statistics
 */
export const getLocationStatistics = async () => {
  const stats = await User.findAll({
    attributes: ['country', 'state', 'city', [User.sequelize!.fn('COUNT', User.sequelize!.col('id')), 'userCount']],
    where: {
      isBlocked: false,
    },
    group: ['country', 'state', 'city'],
    order: [[User.sequelize!.fn('COUNT', User.sequelize!.col('id')), 'DESC']],
    raw: true,
  });

  const totalUsers = await User.count({ where: { isBlocked: false } });

  const addressCompleteness = await User.findAll({
    attributes: [
      [
        User.sequelize!.literal(`
          CASE 
            WHEN city IS NOT NULL AND state IS NOT NULL AND country IS NOT NULL THEN 'COMPLETE'
            WHEN city IS NOT NULL OR state IS NOT NULL OR country IS NOT NULL THEN 'PARTIAL'
            ELSE 'MISSING'
          END
        `),
        'completeness',
      ],
      [User.sequelize!.fn('COUNT', User.sequelize!.col('id')), 'count'],
    ],
    where: {
      isBlocked: false,
    },
    group: [User.sequelize!.literal('completeness') as any],
    raw: true,
  });

  return {
    totalUsers,
    locationBreakdown: stats,
    addressCompleteness,
  };
};

/**
 * Check if user can proceed with booking
 */
export const checkBookingEligibility = async (
  userId: string,
): Promise<{
  eligible: boolean;
  reason?: string;
  restrictions?: any;
  missingDocuments?: string[];
  verificationStatus?: string;
}> => {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: UserIdentityDocument,
        as: 'identityDocument',
        required: false,
      },
      {
        model: UserDrivingInfo,
        as: 'drivingInfo',
        required: false,
      },
    ],
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  const userJson = user.toJSON() as any;

  // Check if user has driving info
  if (!userJson.drivingInfo) {
    return {
      eligible: false,
      reason: 'Please complete your driving license information first.',
    };
  }

  // Check if user has uploaded documents
  const identityDoc = userJson.identityDocument;
  const missingDocuments: string[] = [];

  verificationConfig.requiredDocuments.forEach((doc) => {
    if (!identityDoc || !identityDoc[doc]) {
      missingDocuments.push(doc);
    }
  });

  if (missingDocuments.length > 0) {
    return {
      eligible: false,
      reason: 'Please upload all required identity documents.',
      missingDocuments,
    };
  }

  // Check verification status
  const verificationStatus = identityDoc?.verificationStatus || 'PENDING';
  const bookingCheck = canUserBook(verificationStatus);

  return {
    eligible: bookingCheck.allowed,
    reason: bookingCheck.reason,
    restrictions: bookingCheck.restrictions,
    verificationStatus,
  };
};
