import { BaseApiService } from '../base';
import type { ApiResponse } from '../../../common/interfaces';

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
  verificationStatus?: string;
  restrictions?: {
    maxBookingValue?: number;
    requireDepositPayment?: boolean;
    cannotBookPremiumVehicles?: boolean;
  };
  missingDocuments?: string[];
}

export interface DocumentUploadRequest {
  driverLicenseFront?: File;
  driverLicenseBack?: File;
  passportPhoto?: File;
  internationalDrivingPermit?: File;
  selfieWithLicense?: File;
}

export class DocumentService extends BaseApiService {
  constructor() {
    super('/users');
  }

  private getDefaultRequiredDocuments(bookingType: 'SELF_DRIVE' | 'CHAUFFEUR' = 'SELF_DRIVE'): RequiredDocument[] {
    return [
      {
        field: 'driverLicenseFront',
        name: 'Driver License (Front)',
        description: 'Front side image of your valid driving license',
        required: true,
        bookingTypes: ['SELF_DRIVE', 'CHAUFFEUR'],
      },
      {
        field: 'driverLicenseBack',
        name: 'Driver License (Back)',
        description: 'Back side image of your valid driving license',
        required: true,
        bookingTypes: ['SELF_DRIVE', 'CHAUFFEUR'],
      },
      {
        field: 'passportPhoto',
        name: 'Passport Photo',
        description: 'Clear image of passport photo page',
        required: true,
        bookingTypes: ['SELF_DRIVE', 'CHAUFFEUR'],
      },
      {
        field: 'selfieWithLicense',
        name: 'Selfie With License',
        description: 'Selfie while holding your driving license',
        required: true,
        bookingTypes: ['SELF_DRIVE', 'CHAUFFEUR'],
      },
      {
        field: 'internationalDrivingPermit',
        name: 'International Driving Permit',
        description: 'International permit if applicable',
        required: false,
        bookingTypes: ['SELF_DRIVE', 'CHAUFFEUR'],
      },
    ].filter((doc) => doc.bookingTypes.includes(bookingType));
  }

  /**
   * Check document completeness for a user
   */
  async checkDocumentCompleteness(): Promise<ApiResponse<DocumentStatus>> {
    return this.get<DocumentStatus>('/documents/completeness');
  }

  /**
   * Get required documents for a specific booking type
   */
  async getRequiredDocuments(
    bookingType: 'SELF_DRIVE' | 'CHAUFFEUR' = 'SELF_DRIVE',
  ): Promise<ApiResponse<RequiredDocument[]>> {
    return {
      success: true,
      message: 'Required documents retrieved successfully',
      data: this.getDefaultRequiredDocuments(bookingType),
    };
  }

  /**
   * Validate documents for a specific booking
   */
  async validateDocumentForBooking(
    bookingType: 'SELF_DRIVE' | 'CHAUFFEUR' = 'SELF_DRIVE',
  ): Promise<ApiResponse<ValidationResult>> {
    return this.get<ValidationResult>(`/documents/validate?bookingType=${bookingType}`);
  }

  /**
   * Get missing documents for a user
   */
  async getMissingDocuments(
    bookingType: 'SELF_DRIVE' | 'CHAUFFEUR' = 'SELF_DRIVE',
  ): Promise<ApiResponse<MissingDocument[]>> {
    const [requiredResponse, completenessResponse] = await Promise.all([
      this.getRequiredDocuments(bookingType),
      this.checkDocumentCompleteness(),
    ]);

    if (!requiredResponse.success || !completenessResponse.success) {
      return {
        success: false,
        message: 'Unable to determine missing documents',
        data: [],
      };
    }

    const missingSet = new Set(completenessResponse.data?.missingDocuments || []);
    const missingDocuments = (requiredResponse.data || [])
      .filter((doc) => doc.required && missingSet.has(doc.field))
      .map((doc) => ({
        field: doc.field,
        name: doc.name,
        description: doc.description,
      }));

    return {
      success: true,
      message: 'Missing documents retrieved successfully',
      data: missingDocuments,
    };
  }

  /**
   * Check if document upload step should be skipped
   */
  async shouldSkipDocumentStep(bookingType: 'SELF_DRIVE' | 'CHAUFFEUR' = 'SELF_DRIVE'): Promise<ApiResponse<boolean>> {
    return this.get<boolean>(`/documents/skip-step?bookingType=${bookingType}`);
  }

  /**
   * Check booking eligibility based on document status
   */
  async checkBookingEligibility(
    bookingType: 'SELF_DRIVE' | 'CHAUFFEUR' = 'SELF_DRIVE',
  ): Promise<ApiResponse<EligibilityResult>> {
    return this.get<EligibilityResult>(`/documents/eligibility?bookingType=${bookingType}`);
  }

  /**
   * Upload documents (uses the existing user profile update endpoint)
   */
  async uploadDocuments(documents: DocumentUploadRequest): Promise<ApiResponse<any>> {
    const userService = await import('./user');
    return userService.userService.updateProfile(documents);
  }

  /**
   * Update document verification status (admin only)
   */
  async updateVerificationStatus(
    _verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'EXPIRED',
    _verificationNotes?: string,
  ): Promise<ApiResponse<DocumentStatus>> {
    return {
      success: false,
      message: 'Document verification status update is not supported by current backend API',
      data: null as any,
    };
  }

  /**
   * Update document expiry date
   */
  async updateExpiryDate(_expiryDate: Date): Promise<ApiResponse<void>> {
    return {
      success: false,
      message: 'Document expiry date update is not supported by current backend API',
      data: undefined as any,
    };
  }

  /**
   * Get documents expiring soon
   */
  async getExpiringDocuments(_daysAhead: number = 30): Promise<ApiResponse<string[]>> {
    return {
      success: false,
      message: 'Expiring documents endpoint is not supported by current backend API',
      data: [],
    };
  }
}

export const documentService = new DocumentService();
