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

    /**
     * Check document completeness for a user
     */
    async checkDocumentCompleteness(): Promise<ApiResponse<DocumentStatus>> {
        return this.get<DocumentStatus>('/documents/completeness');
    }

    /**
     * Get required documents for a specific booking type
     */
    async getRequiredDocuments(bookingType: 'SELF_DRIVE' | 'CHAUFFEUR' = 'SELF_DRIVE'): Promise<ApiResponse<RequiredDocument[]>> {
        return this.get<RequiredDocument[]>(`/documents/required?bookingType=${bookingType}`);
    }

    /**
     * Validate documents for a specific booking
     */
    async validateDocumentForBooking(bookingType: 'SELF_DRIVE' | 'CHAUFFEUR' = 'SELF_DRIVE'): Promise<ApiResponse<ValidationResult>> {
        return this.get<ValidationResult>(`/documents/validate?bookingType=${bookingType}`);
    }

    /**
     * Get missing documents for a user
     */
    async getMissingDocuments(bookingType: 'SELF_DRIVE' | 'CHAUFFEUR' = 'SELF_DRIVE'): Promise<ApiResponse<MissingDocument[]>> {
        return this.get<MissingDocument[]>(`/documents/missing?bookingType=${bookingType}`);
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
    async checkBookingEligibility(bookingType: 'SELF_DRIVE' | 'CHAUFFEUR' = 'SELF_DRIVE'): Promise<ApiResponse<EligibilityResult>> {
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
        verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'EXPIRED',
        verificationNotes?: string
    ): Promise<ApiResponse<DocumentStatus>> {
        return this.put<DocumentStatus>('/documents/verification-status', {
            verificationStatus,
            verificationNotes
        });
    }

    /**
     * Update document expiry date
     */
    async updateExpiryDate(expiryDate: Date): Promise<ApiResponse<void>> {
        return this.put<void>('/documents/expiry-date', {
            expiryDate: expiryDate.toISOString()
        });
    }

    /**
     * Get documents expiring soon
     */
    async getExpiringDocuments(daysAhead: number = 30): Promise<ApiResponse<string[]>> {
        return this.get<string[]>(`/documents/expiring?daysAhead=${daysAhead}`);
    }
}

export const documentService = new DocumentService();