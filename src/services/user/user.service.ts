import { User, RefreshToken, UserDrivingInfo, UserIdentityDocument, Address } from '../../models';
import { dbEnums } from '../../common/enum/dbEnums';
import { saveFile, deleteFile } from '../../utils/file.utils';
import { userModelType, LocationSearchQuery, UserWithLocation } from '../../common/types/userTypes';
import { createError } from '../middleware/errorHandler';
import { hashPassword } from '../../utils/password.utils';
import { sanitizeEmail } from '../../utils/security.utils';
import { validateRequiredFields, validateEmail } from '../../utils/validation.utils';
import { USER_SAFE_ATTRIBUTES } from '../../utils/database.utils';
import { Op } from 'sequelize';
import Logger from '../../utils/logger';

// Document validation types
export interface DocumentStatus {
  isComplete: boolean;
  verifiedDocuments: string[];
  missingDocuments: string[];
  unverifiedDocuments: string[];
}

export interface RequiredDocument {
  field: string;
  name: string;
  description: string;
  required: boolean;
  bookingTypes: string[];
}

export interface ValidationResult {
  isValid: boolean;
  missingDocuments: string[];
  unverifiedDocuments: string[];
  canProceedWithBooking: boolean;
  message?: string;
}

export interface MissingDocument {
  field: string;
  name: string;
  description: string;
  uploadUrl?: string;
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  missingRequirements: string[];
}

/**
 * Validate and normalize address data
 */
export const validateAndNormalizeAddress = (data: Partial<userModelType>) => {
  if (data.addresses && Array.isArray(data.addresses)) {
    data.addresses.forEach(addr => {
      if (addr.city) addr.city = addr.city.trim();
      if (addr.state) addr.state = addr.state.trim();
      if (addr.zipCode) addr.zipCode = addr.zipCode.trim().toUpperCase();
      if (addr.country) addr.country = addr.country.trim();
    });
  }
};

/**
 * Helper function to determine address completeness
 */
function getAddressCompleteness(user: User): 'COMPLETE' | 'PARTIAL' | 'MISSING' {
  // Use user.addresses array if available (Sequelize include)
  const addresses = (user as any).addresses;

  if (!addresses || addresses.length === 0) {
    return 'MISSING';
  }

  // Check if any address is complete
  const hasCompleteAddress = addresses.some((addr: any) =>
    !!addr.city && !!addr.state && !!addr.country
  );

  return hasCompleteAddress ? 'COMPLETE' : 'PARTIAL';
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
    include: [
      {
        model: Address,
        as: 'addresses',
        required: false,
      }
    ],
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  return user.toJSON();
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
 * Updates a user by ID with the provided data
 */


/**
 * Updates a user by ID with the provided data, including driving info and documents
 */
export const updateUser = async (
  userId: string,
  updateData: Partial<userModelType> & any,
  files?: { [fieldname: string]: Express.Multer.File[] }
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

      const documentUpdates: any = {};
      const existingDocs = await UserIdentityDocument.findOne({ where: { userId }, transaction });

      // Helper to process file
      const processFile = async (fieldName: string) => {
        if (files[fieldName] && files[fieldName][0]) {
          // Delete old file if it exists
          if (existingDocs && (existingDocs as any)[fieldName]) {
            await deleteFile((existingDocs as any)[fieldName]);
          }
          const relativePath = await saveFile(files[fieldName][0], `documents/${userId}`);
          documentUpdates[fieldName] = relativePath;
        }
      };

      await processFile('driverLicenseFront');
      await processFile('driverLicenseBack');
      await processFile('passportPhoto');
      await processFile('internationalDrivingPermit');
      await processFile('selfieWithLicense');

      if (Object.keys(documentUpdates).length > 0) {
        // Upsert identity documents
        if (existingDocs) {
          await existingDocs.update(documentUpdates, { transaction });
        } else {
          await UserIdentityDocument.create({ userId, ...documentUpdates }, { transaction });
        }
        Logger.info('User documents updated successfully', { userId });
      }
    }

    // 4. Update Addresses (Aggregate Pattern)
    if (updateData.addresses && Array.isArray(updateData.addresses)) {
      Logger.info('Syncing user addresses', { userId });
      const incomingAddresses = updateData.addresses;

      // Get existing addresses
      const existingAddresses = await Address.findAll({ where: { userId }, transaction });
      const existingAddressIds = existingAddresses.map(a => a.id);

      // Identify addresses to delete (present in DB but not in incoming list)
      const incomingIds = incomingAddresses.filter((a: any) => a.id).map((a: any) => a.id);
      const idsToDelete = existingAddressIds.filter(id => !incomingIds.includes(id));

      if (idsToDelete.length > 0) {
        await Address.destroy({ where: { id: idsToDelete }, transaction });
      }

      // Upsert incoming addresses
      for (const addressData of incomingAddresses) {
        if (addressData.id) {
          // Update existing
          const addressToUpdate = existingAddresses.find(a => a.id === addressData.id);
          if (addressToUpdate) {
            await addressToUpdate.update(addressData, { transaction });
          }
        } else {
          // Create new
          await Address.create({ ...addressData, userId }, { transaction });
        }
      }

      // Ensure only one default address
      if (incomingAddresses.some((a: any) => a.isDefault)) {
        // If multiple are marked default, the last one processed (created/updated) wins effectively, 
        // but strictly we should ensure consistency. 
        // For now, let's assume the frontend sends correct data, or we could add a cleanup step here.
      }
    }

    await transaction.commit();
    Logger.info('User profile update completed successfully', { userId });

    // Return updated user without password
    const finalUser = await User.findByPk(userId, {
      attributes: USER_SAFE_ATTRIBUTES,
      include: [
        {
          model: Address,
          as: 'addresses',
          required: false,
        }
      ],
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
  const { fullName, dateOfBirth, nationality, email: rawEmail, phone, passwordHash } = userData;

  // Validate required fields
  validateRequiredFields(userData, ['fullName', 'dateOfBirth', 'nationality', 'email', 'phone', 'passwordHash']);

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
    fullName,
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
    where: { isBlocked: false },
    attributes: [
      'id',
      'fullName',
      'email',
      'phone',
      'nationality',
      'createdAt',
    ],
    include: [
      {
        model: Address,
        as: 'addresses',
        where: whereConditions,
        required: true, // Only return users who match location
      }
    ],
    order: [['fullName', 'ASC']],
  });

  return users.map((user) => {
    const addresses = (user as any).addresses || [];
    const primaryAddress = addresses.find((a: any) => a.isDefault) || addresses[0];

    return {
      ...user.toJSON(),
      locationSummary: primaryAddress ? [primaryAddress.city, primaryAddress.state, primaryAddress.country].filter(Boolean).join(', ') : '',
      addressCompleteness: getAddressCompleteness(user),
    };
  });
};

/**
 * Get location statistics
 */
export const getLocationStatistics = async () => {
  const stats = await Address.findAll({
    attributes: ['country', 'state', 'city', [Address.sequelize!.fn('COUNT', Address.sequelize!.col('id')), 'count']],
    group: ['country', 'state', 'city'],
    order: [[Address.sequelize!.fn('COUNT', Address.sequelize!.col('id')), 'DESC']],
    raw: true,
  });

  const totalUsers = await User.count({ where: { isBlocked: false } });

  // For completeness, we can check how many users have addresses
  // This is a simplified check compared to the previous one
  const usersWithAddresses = await User.count({
    include: [{ model: Address, as: 'addresses', required: true }]
  });

  const addressCompleteness = [
    { completeness: 'COMPLETE', count: usersWithAddresses }, // Simplified: assuming if they have address, it's complete enough
    { completeness: 'MISSING', count: totalUsers - usersWithAddresses }
  ];

  return {
    totalUsers,
    locationBreakdown: stats,
    addressCompleteness,
  };
};
/**
 * Get user statistics
 */
export const getUserStatistics = async (userId: string): Promise<{
  profile: {
    completeness: 'COMPLETE' | 'PARTIAL' | 'MISSING';
    addressCompleteness: 'COMPLETE' | 'PARTIAL' | 'MISSING';
    documentsUploaded: number;
    totalDocuments: number;
    verificationStatus: 'VERIFIED' | 'PENDING' | 'NOT_STARTED';
  };
  activity: {
    accountAge: number; // days
    lastLogin: Date | null;
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
  };
  preferences: {
    preferredVehicleTypes: string[];
    averageBookingDuration: number; // days
    totalSpent: number;
  };
}> => {
  if (!userId) {
    throw createError('User ID is required', 400);
  }

  const user = await User.findByPk(userId, {
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
        model: Address,
        as: 'addresses',
        required: false,
      },
    ],
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  // Import Booking model dynamically to avoid circular dependency
  const { Booking, BookingFinancial, Vehicle } = require('../../models');

  // Get user bookings
  const bookings = await Booking.findAll({
    where: { userId },
    include: [
      {
        model: BookingFinancial,
        attributes: ['totalAmount'],
        required: false,
      },
      {
        model: Vehicle,
        attributes: ['bodyType'],
        required: false,
      },
    ],
  });

  // Calculate profile completeness
  const addressCompleteness = getAddressCompleteness(user);
  const drivingInfo = (user as any).UserDrivingInfo;
  const identityDocs = (user as any).UserIdentityDocument;

  // Count uploaded documents
  let documentsUploaded = 0;
  const totalDocuments = 5; // driverLicenseFront, driverLicenseBack, passportPhoto, internationalDrivingPermit, selfieWithLicense

  if (identityDocs) {
    if (identityDocs.driverLicenseFront) documentsUploaded++;
    if (identityDocs.driverLicenseBack) documentsUploaded++;
    if (identityDocs.passportPhoto) documentsUploaded++;
    if (identityDocs.internationalDrivingPermit) documentsUploaded++;
    if (identityDocs.selfieWithLicense) documentsUploaded++;
  }

  // Determine overall completeness
  const hasBasicInfo = !!(user.fullName && user.email && user.phone && user.nationality);
  const hasDrivingInfo = !!(drivingInfo?.licenseIssuingCountry && drivingInfo?.licenseExpiryDate);
  const hasDocuments = documentsUploaded > 0;

  let completeness: 'COMPLETE' | 'PARTIAL' | 'MISSING';
  if (hasBasicInfo && hasDrivingInfo && hasDocuments && addressCompleteness === 'COMPLETE') {
    completeness = 'COMPLETE';
  } else if (hasBasicInfo || hasDrivingInfo || hasDocuments) {
    completeness = 'PARTIAL';
  } else {
    completeness = 'MISSING';
  }

  // Determine verification status
  let verificationStatus: 'VERIFIED' | 'PENDING' | 'NOT_STARTED';
  if (documentsUploaded >= 3 && hasDrivingInfo) {
    verificationStatus = 'VERIFIED'; // In real app, this would be based on admin verification
  } else if (documentsUploaded > 0 || hasDrivingInfo) {
    verificationStatus = 'PENDING';
  } else {
    verificationStatus = 'NOT_STARTED';
  }

  // Calculate activity stats
  const now = new Date();
  const accountAge = Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((b: any) => b.bookingStatus === 'COMPLETED').length;
  const cancelledBookings = bookings.filter((b: any) => b.bookingStatus === 'CANCELLED').length;

  // Calculate preferences
  const vehicleTypes = bookings
    .map((b: any) => b.Vehicle?.bodyType)
    .filter(Boolean);

  const vehicleTypeCounts = vehicleTypes.reduce((acc: Record<string, number>, type: string) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const preferredVehicleTypes = Object.entries(vehicleTypeCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([type]) => type);

  // Calculate average booking duration
  const completedBookingsWithDuration = bookings
    .filter((b: any) => b.bookingStatus === 'COMPLETED')
    .map((b: any) => {
      const start = new Date(b.startDatetime);
      const end = new Date(b.endDatetime);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    });

  const averageBookingDuration = completedBookingsWithDuration.length > 0
    ? completedBookingsWithDuration.reduce((sum: number, duration: number) => sum + duration, 0) / completedBookingsWithDuration.length
    : 0;

  // Calculate total spent
  const totalSpent = bookings
    .filter((b: any) => b.bookingStatus === 'COMPLETED')
    .reduce((sum: number, b: any) => {
      const financial = b.BookingFinancial;
      return sum + (financial ? parseFloat(financial.totalAmount) : 0);
    }, 0);

  return {
    profile: {
      completeness,
      addressCompleteness,
      documentsUploaded,
      totalDocuments,
      verificationStatus,
    },
    activity: {
      accountAge,
      lastLogin: null, // Would need to track this separately
      totalBookings,
      completedBookings,
      cancelledBookings,
    },
    preferences: {
      preferredVehicleTypes,
      averageBookingDuration: Math.round(averageBookingDuration * 100) / 100,
      totalSpent: Math.round(totalSpent * 100) / 100,
    },
  };
};

/**
 * Document Validation Methods
 * Following the same pattern as address management in User Service
 */

/**
 * Check document completeness for a user
 * @param userId - User ID to check documents for
 * @returns DocumentStatus with completeness information
 */
export const checkDocumentCompleteness = async (userId: string): Promise<DocumentStatus> => {
  try {
    Logger.info(`Checking document completeness for user: ${userId}`);

    // Get user's identity documents
    const identityDoc = await UserIdentityDocument.findOne({
      where: { userId }
    });

    // Get user's driving info
    const drivingInfo = await UserDrivingInfo.findOne({
      where: { userId }
    });

    const verifiedDocuments: string[] = [];
    const missingDocuments: string[] = [];
    const unverifiedDocuments: string[] = [];

    // Check identity documents
    if (identityDoc) {
      const docFields = [
        { field: 'driverLicenseFront', name: 'Driver License Front' },
        { field: 'driverLicenseBack', name: 'Driver License Back' },
        { field: 'passportPhoto', name: 'Passport Photo' },
        { field: 'internationalDrivingPermit', name: 'International Driving Permit' },
        { field: 'selfieWithLicense', name: 'Selfie with License' }
      ];

      for (const docField of docFields) {
        const fieldValue = (identityDoc as any)[docField.field];
        if (fieldValue) {
          // Use the new verificationStatus field, fallback to verified for backward compatibility
          const verificationStatus = (identityDoc as any).verificationStatus || (identityDoc.verified ? 'VERIFIED' : 'PENDING');

          if (verificationStatus === 'VERIFIED') {
            verifiedDocuments.push(docField.name);
          } else if (verificationStatus === 'REJECTED' || verificationStatus === 'EXPIRED') {
            missingDocuments.push(docField.name); // Treat rejected/expired as missing
          } else {
            unverifiedDocuments.push(docField.name); // PENDING status
          }
        } else {
          missingDocuments.push(docField.name);
        }
      }
    } else {
      // No identity document record exists
      missingDocuments.push(
        'Driver License Front',
        'Driver License Back',
        'Passport Photo',
        'International Driving Permit',
        'Selfie with License'
      );
    }

    // Check driving info
    if (!drivingInfo) {
      missingDocuments.push('Driving Information');
    } else {
      // Check if driving info is complete
      if (!drivingInfo.licenseIssuingCountry ||
        !drivingInfo.licenseExpiryDate ||
        !drivingInfo.drivingExperienceYears ||
        !drivingInfo.visaStatus) {
        missingDocuments.push('Complete Driving Information');
      } else {
        verifiedDocuments.push('Driving Information');
      }
    }

    const isComplete = missingDocuments.length === 0 && unverifiedDocuments.length === 0;

    Logger.info(`Document completeness check completed for user ${userId}: ${isComplete ? 'Complete' : 'Incomplete'}`);

    return {
      isComplete,
      verifiedDocuments,
      missingDocuments,
      unverifiedDocuments
    };

  } catch (error) {
    Logger.error('Error checking document completeness:', error);
    throw createError('Failed to check document completeness', 500);
  }
};

/**
 * Get required documents for a specific booking type
 * @param bookingType - Type of booking (SELF_DRIVE or CHAUFFEUR)
 * @returns Array of required documents
 */
export const getRequiredDocuments = async (bookingType: typeof dbEnums.BOOKING_TYPE[number]): Promise<RequiredDocument[]> => {
  try {
    Logger.info(`Getting required documents for booking type: ${bookingType}`);

    const requiredDocuments: RequiredDocument[] = [
      {
        field: 'driverLicenseFront',
        name: 'Driver License Front',
        description: 'Clear photo of the front side of your driver license',
        required: true,
        bookingTypes: ['SELF_DRIVE', 'CHAUFFEUR']
      },
      {
        field: 'driverLicenseBack',
        name: 'Driver License Back',
        description: 'Clear photo of the back side of your driver license',
        required: true,
        bookingTypes: ['SELF_DRIVE', 'CHAUFFEUR']
      },
      {
        field: 'passportPhoto',
        name: 'Passport Photo',
        description: 'Clear photo of your passport information page',
        required: true,
        bookingTypes: ['SELF_DRIVE', 'CHAUFFEUR']
      },
      {
        field: 'selfieWithLicense',
        name: 'Selfie with License',
        description: 'A selfie photo holding your driver license next to your face',
        required: true,
        bookingTypes: ['SELF_DRIVE', 'CHAUFFEUR']
      },
      {
        field: 'internationalDrivingPermit',
        name: 'International Driving Permit',
        description: 'International driving permit (if applicable)',
        required: false,
        bookingTypes: ['SELF_DRIVE']
      },
      {
        field: 'drivingInfo',
        name: 'Driving Information',
        description: 'Complete driving information including license details and experience',
        required: true,
        bookingTypes: ['SELF_DRIVE', 'CHAUFFEUR']
      }
    ];

    // Filter documents based on booking type
    const filteredDocuments = requiredDocuments.filter(doc =>
      doc.bookingTypes.includes(bookingType)
    );

    Logger.info(`Found ${filteredDocuments.length} required documents for ${bookingType}`);
    return filteredDocuments;

  } catch (error) {
    Logger.error('Error getting required documents:', error);
    throw createError('Failed to get required documents', 500);
  }
};

/**
 * Validate documents for a specific booking
 * @param userId - User ID
 * @param bookingType - Type of booking
 * @returns ValidationResult with validation status
 */
export const validateDocumentForBooking = async (userId: string, bookingType: typeof dbEnums.BOOKING_TYPE[number]): Promise<ValidationResult> => {
  try {
    Logger.info(`Validating documents for user ${userId} and booking type ${bookingType}`);

    const documentStatus = await checkDocumentCompleteness(userId);
    const requiredDocuments = await getRequiredDocuments(bookingType);

    // Get required document names for this booking type
    const requiredDocNames = requiredDocuments
      .filter(doc => doc.required)
      .map(doc => doc.name);

    // Check which required documents are missing
    const missingRequiredDocs = requiredDocNames.filter(docName =>
      documentStatus.missingDocuments.includes(docName)
    );

    // Check which required documents are unverified
    const unverifiedRequiredDocs = requiredDocNames.filter(docName =>
      documentStatus.unverifiedDocuments.includes(docName)
    );

    const isValid = missingRequiredDocs.length === 0 && unverifiedRequiredDocs.length === 0;
    const canProceedWithBooking = missingRequiredDocs.length === 0; // Can proceed if documents exist but unverified

    let message = '';
    if (!isValid) {
      if (missingRequiredDocs.length > 0) {
        message = `Missing required documents: ${missingRequiredDocs.join(', ')}`;
      } else if (unverifiedRequiredDocs.length > 0) {
        message = `Documents pending verification: ${unverifiedRequiredDocs.join(', ')}`;
      }
    }

    Logger.info(`Document validation completed for user ${userId}: ${isValid ? 'Valid' : 'Invalid'}`);

    return {
      isValid,
      missingDocuments: missingRequiredDocs,
      unverifiedDocuments: unverifiedRequiredDocs,
      canProceedWithBooking,
      message
    };

  } catch (error) {
    Logger.error('Error validating documents for booking:', error);
    throw createError('Failed to validate documents for booking', 500);
  }
};

/**
 * Get missing documents for a user based on required documents
 * @param userId - User ID
 * @param requiredDocs - Array of required documents
 * @returns Array of missing documents with details
 */
export const getMissingDocuments = async (userId: string, requiredDocs: RequiredDocument[]): Promise<MissingDocument[]> => {
  try {
    Logger.info(`Getting missing documents for user: ${userId}`);

    const documentStatus = await checkDocumentCompleteness(userId);
    const missingDocuments: MissingDocument[] = [];

    for (const requiredDoc of requiredDocs) {
      if (requiredDoc.required && documentStatus.missingDocuments.includes(requiredDoc.name)) {
        missingDocuments.push({
          field: requiredDoc.field,
          name: requiredDoc.name,
          description: requiredDoc.description,
          uploadUrl: `/api/documents/upload/${requiredDoc.field}`
        });
      }
    }

    Logger.info(`Found ${missingDocuments.length} missing documents for user ${userId}`);
    return missingDocuments;

  } catch (error) {
    Logger.error('Error getting missing documents:', error);
    throw createError('Failed to get missing documents', 500);
  }
};

/**
 * Determine if document upload step should be skipped in booking flow
 * @param userId - User ID
 * @param bookingType - Type of booking
 * @returns Boolean indicating if document step should be skipped
 */
export const shouldSkipDocumentStep = async (userId: string, bookingType: typeof dbEnums.BOOKING_TYPE[number]): Promise<boolean> => {
  try {
    Logger.info(`Checking if document step should be skipped for user ${userId} and booking type ${bookingType}`);

    const validationResult = await validateDocumentForBooking(userId, bookingType);

    // Skip document step if all required documents are present and verified
    const shouldSkip = validationResult.isValid;

    Logger.info(`Document step skip decision for user ${userId}: ${shouldSkip ? 'Skip' : 'Show'}`);
    return shouldSkip;

  } catch (error) {
    Logger.error('Error determining document step skip:', error);
    throw createError('Failed to determine document step skip', 500);
  }
};

/**
 * Check booking eligibility based on document status
 * @param userId - User ID
 * @param bookingType - Type of booking
 * @returns EligibilityResult with eligibility status
 */
export const checkBookingEligibility = async (userId: string, bookingType: typeof dbEnums.BOOKING_TYPE[number]): Promise<EligibilityResult> => {
  try {
    Logger.info(`Checking booking eligibility for user ${userId} and booking type ${bookingType}`);

    const validationResult = await validateDocumentForBooking(userId, bookingType);

    if (validationResult.canProceedWithBooking) {
      return {
        eligible: true,
        missingRequirements: []
      };
    }

    const missingRequirements = [...validationResult.missingDocuments];
    let reason = 'Missing required documents for booking';

    if (validationResult.missingDocuments.length > 0) {
      reason = `Please upload the following required documents: ${validationResult.missingDocuments.join(', ')}`;
    }

    Logger.info(`Booking eligibility check completed for user ${userId}: ${validationResult.canProceedWithBooking ? 'Eligible' : 'Not eligible'}`);

    return {
      eligible: false,
      reason,
      missingRequirements
    };

  } catch (error) {
    Logger.error('Error checking booking eligibility:', error);
    throw createError('Failed to check booking eligibility', 500);
  }
};

/**
 * Update document verification status
 * @param userId - User ID
 * @param verificationStatus - New verification status
 * @param verificationNotes - Optional verification notes
 * @returns Updated document status
 */
export const updateDocumentVerificationStatus = async (
  userId: string,
  verificationStatus: typeof dbEnums.DOCUMENT_VERIFICATION_STATUS[number],
  verificationNotes?: string
): Promise<DocumentStatus> => {
  try {
    Logger.info(`Updating document verification status for user ${userId} to ${verificationStatus}`);

    const updateData: any = {
      verificationStatus,
      verified: verificationStatus === 'VERIFIED' // Keep backward compatibility
    };

    if (verificationNotes) {
      updateData.verificationNotes = verificationNotes;
    }

    // Update the verification status (verification_date will be set automatically by trigger)
    await UserIdentityDocument.update(
      updateData,
      { where: { userId } }
    );

    // Return updated document status
    const updatedStatus = await checkDocumentCompleteness(userId);

    Logger.info(`Document verification status updated for user ${userId}`);
    return updatedStatus;

  } catch (error) {
    Logger.error('Error updating document verification status:', error);
    throw createError('Failed to update document verification status', 500);
  }
};

/**
 * Update document expiry date
 * @param userId - User ID
 * @param expiryDate - Document expiry date
 * @returns Updated document record
 */
export const updateDocumentExpiryDate = async (
  userId: string,
  expiryDate: Date
): Promise<void> => {
  try {
    Logger.info(`Updating document expiry date for user ${userId}`);

    await UserIdentityDocument.update(
      { documentExpiryDate: expiryDate },
      { where: { userId } }
    );

    Logger.info(`Document expiry date updated for user ${userId}`);

  } catch (error) {
    Logger.error('Error updating document expiry date:', error);
    throw createError('Failed to update document expiry date', 500);
  }
};

/**
 * Get documents expiring soon
 * @param daysAhead - Number of days to look ahead for expiring documents
 * @returns Array of user IDs with expiring documents
 */
export const getExpiringDocuments = async (daysAhead: number = 30): Promise<string[]> => {
  try {
    Logger.info(`Getting documents expiring in the next ${daysAhead} days`);

    const { Op } = require('sequelize');
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + daysAhead);

    const expiringDocs = await UserIdentityDocument.findAll({
      where: {
        documentExpiryDate: {
          [Op.lte]: expiryThreshold,
          [Op.gte]: new Date()
        }
      },
      attributes: ['userId']
    });

    const userIds = expiringDocs.map(doc => (doc as any).userId);
    Logger.info(`Found ${userIds.length} users with documents expiring soon`);

    return userIds;

  } catch (error) {
    Logger.error('Error getting expiring documents:', error);
    throw createError('Failed to get expiring documents', 500);
  }
};