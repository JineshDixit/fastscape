import { useState, useCallback } from 'react';
import {
  documentService,
  type DocumentUploadRequest,
  type DocumentStatus,
  type ValidationResult,
  type RequiredDocument,
  type EligibilityResult,
} from '../services/document';
import type { ApiResponse } from '@/common/interfaces';

export interface UseDocumentReturn {
  documentStatus: DocumentStatus | null;
  validationResult: ValidationResult | null;
  requiredDocuments: RequiredDocument[];
  eligibilityResult: EligibilityResult | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  checkDocumentCompleteness: () => Promise<void>;
  getRequiredDocuments: (bookingType?: 'SELF_DRIVE' | 'CHAUFFEUR') => Promise<void>;
  validateDocumentForBooking: (bookingType?: 'SELF_DRIVE' | 'CHAUFFEUR') => Promise<void>;
  checkBookingEligibility: (bookingType?: 'SELF_DRIVE' | 'CHAUFFEUR') => Promise<ApiResponse<EligibilityResult>>;
  uploadDocuments: (documents: DocumentUploadRequest) => Promise<boolean>;
  shouldSkipDocumentStep: (bookingType?: 'SELF_DRIVE' | 'CHAUFFEUR') => Promise<boolean>;

  // Computed
  isDocumentComplete: boolean;
  canProceedWithBooking: boolean;
  missingDocumentCount: number;
  verifiedDocumentCount: number;
}

export const useDocument = (): UseDocumentReturn => {
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([]);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDocumentCompleteness = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await documentService.checkDocumentCompleteness();

      if (response.success && response.data) {
        setDocumentStatus(response.data);
      } else {
        setError(response.message || 'Failed to check document completeness');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while checking document completeness');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRequiredDocuments = useCallback(async (bookingType: 'SELF_DRIVE' | 'CHAUFFEUR' = 'SELF_DRIVE') => {
    try {
      console.log(`[useDocument] getRequiredDocuments for ${bookingType}`);
      setIsLoading(true);
      setError(null);

      const response = await documentService.getRequiredDocuments(bookingType);

      if (response.success && response.data) {
        setRequiredDocuments(response.data);
      } else {
        setError(response.message || 'Failed to get required documents');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while getting required documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateDocumentForBooking = useCallback(async (bookingType: 'SELF_DRIVE' | 'CHAUFFEUR' = 'SELF_DRIVE') => {
    try {
      console.log(`[useDocument] validateDocumentForBooking for ${bookingType}`);
      setIsLoading(true);
      setError(null);

      const response = await documentService.validateDocumentForBooking(bookingType);

      if (response.success && response.data) {
        setValidationResult(response.data);
      } else {
        setError(response.message || 'Failed to validate documents');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while validating documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkBookingEligibility = useCallback(
    async (bookingType: 'SELF_DRIVE' | 'CHAUFFEUR' = 'SELF_DRIVE'): Promise<ApiResponse<EligibilityResult>> => {
      try {
        console.log(`[useDocument] checkBookingEligibility for ${bookingType}`);
        setIsLoading(true);
        setError(null);

        const response = await documentService.checkBookingEligibility(bookingType);

        if (response.success && response.data) {
          setEligibilityResult(response.data);
        } else {
          setError(response.message || 'Failed to check booking eligibility');
        }
        return response;
      } catch (err: any) {
        const errorMessage = err.message || 'An error occurred while checking booking eligibility';
        setError(errorMessage);
        return {
          success: false,
          message: errorMessage,
          data: { eligible: false, missingRequirements: [] },
        };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const uploadDocuments = useCallback(
    async (documents: DocumentUploadRequest): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await documentService.uploadDocuments(documents);

        if (response.success) {
          // Refresh document status after upload
          await checkDocumentCompleteness();
          return true;
        } else {
          setError(response.message || 'Failed to upload documents');
          return false;
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while uploading documents');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [checkDocumentCompleteness],
  );

  const shouldSkipDocumentStep = useCallback(
    async (bookingType: 'SELF_DRIVE' | 'CHAUFFEUR' = 'SELF_DRIVE'): Promise<boolean> => {
      try {
        console.log(`[useDocument] shouldSkipDocumentStep check for: ${bookingType}`);
        const response = await documentService.shouldSkipDocumentStep(bookingType);

        if (response.success && response.data !== undefined) {
          return response.data;
        } else {
          return false;
        }
      } catch (err: any) {
        console.error('Error checking if document step should be skipped:', err);
        return false;
      }
    },
    [],
  );

  // Computed values
  const isDocumentComplete = documentStatus?.isComplete || false;
  const canProceedWithBooking = validationResult?.canProceedWithBooking || false;
  const missingDocumentCount = documentStatus?.missingDocuments.length || 0;
  const verifiedDocumentCount = documentStatus?.verifiedDocuments.length || 0;

  return {
    documentStatus,
    validationResult,
    requiredDocuments,
    eligibilityResult,
    isLoading,
    error,

    // Actions
    checkDocumentCompleteness,
    getRequiredDocuments,
    validateDocumentForBooking,
    checkBookingEligibility,
    uploadDocuments,
    shouldSkipDocumentStep,

    // Computed
    isDocumentComplete,
    canProceedWithBooking,
    missingDocumentCount,
    verifiedDocumentCount,
  };
};
