import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/expressTypes';
import * as userService from '../../services/user/user.service';
import { BaseController } from '../../utils/controller.utils';
import { sendSuccess } from '../../utils/response.utils';
import { UserDrivingInfo, UserIdentityDocument } from '../../models';

class UserController extends BaseController {
  /**
   * Get current user profile
   */
  getCurrentUser = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const user = await userService.getUserProfile(userId);
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

  /**
   * Check document completeness for booking
   */
  checkDocumentCompleteness = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    
    const identityDoc = await UserIdentityDocument.findOne({ where: { userId } });
    const drivingInfo = await UserDrivingInfo.findOne({ where: { userId } });
    
    const requiredDocuments = ['driverLicenseFront', 'driverLicenseBack', 'passportPhoto', 'selfieWithLicense'];
    const verifiedDocuments: string[] = [];
    const missingDocuments: string[] = [];
    const unverifiedDocuments: string[] = [];

    requiredDocuments.forEach(doc => {
      const hasDocument = identityDoc && (identityDoc as any)[doc];
      if (hasDocument) {
        if (identityDoc.verificationStatus === 'VERIFIED') {
          verifiedDocuments.push(doc);
        } else {
          unverifiedDocuments.push(doc);
        }
      } else {
        missingDocuments.push(doc);
      }
    });

    const isComplete = missingDocuments.length === 0 && unverifiedDocuments.length === 0;

    sendSuccess(res, 'Document completeness checked', {
      isComplete,
      verifiedDocuments,
      missingDocuments,
      unverifiedDocuments,
    });
  });

  /**
   * Check if document step should be skipped
   */
  shouldSkipDocumentStep = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const bookingType = req.query.bookingType as string || 'SELF_DRIVE';
    
    const identityDoc = await UserIdentityDocument.findOne({ where: { userId } });
    const drivingInfo = await UserDrivingInfo.findOne({ where: { userId } });
    
    // Check if all required documents are uploaded and verified
    const requiredDocuments = ['driverLicenseFront', 'driverLicenseBack', 'passportPhoto', 'selfieWithLicense'];
    const allDocumentsPresent = requiredDocuments.every(doc => identityDoc && (identityDoc as any)[doc]);
    const documentsVerified = identityDoc?.verificationStatus === 'VERIFIED';
    const hasDrivingInfo = drivingInfo && drivingInfo.licenseIssuingCountry && drivingInfo.licenseExpiryDate;
    
    const shouldSkip = allDocumentsPresent && documentsVerified && hasDrivingInfo;
    
    sendSuccess(res, 'Document step check completed', shouldSkip);
  });

  /**
   * Validate documents for booking
   */
  validateDocumentForBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const bookingType = req.query.bookingType as string || 'SELF_DRIVE';
    
    const identityDoc = await UserIdentityDocument.findOne({ where: { userId } });
    const drivingInfo = await UserDrivingInfo.findOne({ where: { userId } });
    
    const requiredDocuments = ['driverLicenseFront', 'driverLicenseBack', 'passportPhoto', 'selfieWithLicense'];
    const missingDocuments: string[] = [];
    const unverifiedDocuments: string[] = [];

    requiredDocuments.forEach(doc => {
      const hasDocument = identityDoc && (identityDoc as any)[doc];
      if (!hasDocument) {
        missingDocuments.push(doc);
      } else if (identityDoc.verificationStatus !== 'VERIFIED') {
        unverifiedDocuments.push(doc);
      }
    });

    // Check driving info
    if (!drivingInfo || !drivingInfo.licenseIssuingCountry || !drivingInfo.licenseExpiryDate) {
      missingDocuments.push('drivingInfo');
    }

    const isValid = missingDocuments.length === 0 && unverifiedDocuments.length === 0;
    const canProceedWithBooking = isValid;

    sendSuccess(res, 'Document validation completed', {
      isValid,
      missingDocuments,
      unverifiedDocuments,
      canProceedWithBooking,
      message: isValid ? 'All documents are valid' : 'Some documents are missing or unverified',
    });
  });

  /**
   * Check booking eligibility (comprehensive check with verification config)
   */
  checkBookingEligibility = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const eligibility = await userService.checkBookingEligibility(userId);
    sendSuccess(res, 'Booking eligibility checked', eligibility);
  });
}

const userController = new UserController();

export const { 
  getCurrentUser, 
  updateUserProfile, 
  checkDocumentCompleteness, 
  shouldSkipDocumentStep, 
  validateDocumentForBooking, 
  checkBookingEligibility 
} = userController;
