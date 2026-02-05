'use client';

import { useState, useCallback, useEffect } from 'react';
import { useUser } from './useUser';
import { useDocument } from './useDocument';
import { useBooking } from './useBooking';
import type { UserProfile } from '@/common/interfaces';

export type BookingFlowStep = 'IDENTITY' | 'DOCUMENTS' | 'PAYMENT' | 'SUMMARY';

interface BookingFlowState {
  currentStep: BookingFlowStep;
  isLoading: boolean;
  error: string | null;
  canProceedToNextStep: boolean;
  isInitialized: boolean;
}

interface UseBookingFlowReturn extends BookingFlowState {
  initializeFlow: () => Promise<void>;
  proceedToNextStep: () => Promise<void>;
  goToStep: (step: BookingFlowStep) => void;
  validateCurrentStep: () => Promise<boolean>;
  clearError: () => void;
  profile: UserProfile | null;
}

export const useBookingFlow = (): UseBookingFlowReturn => {
  const [state, setState] = useState<BookingFlowState>({
    currentStep: 'IDENTITY',
    isLoading: false,
    error: null,
    canProceedToNextStep: false,
    isInitialized: false,
  });

  const { profile, fetchProfile, isLoading: profileLoading } = useUser();
  const { shouldSkipDocumentStep, checkBookingEligibility, isLoading: documentLoading } = useDocument();
  const { isLoading: bookingLoading } = useBooking();

  // isLoading is derived from hook states and local state
  const isLoading = profileLoading || documentLoading || bookingLoading || state.isLoading;

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const setError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, error, isLoading: false }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const validateIdentityStep = useCallback(async (): Promise<boolean> => {
    if (!profile) {
      setError('User profile not loaded');
      return false;
    }

    // Check if basic user info is complete
    const hasBasicInfo = !!(profile.firstName && profile.lastName && profile.phone && profile.email);

    if (!hasBasicInfo) {
      setError('Please complete your basic profile information');
      return false;
    }

    return true;
  }, [profile, setError]);

  const validateDocumentStep = useCallback(async (): Promise<boolean> => {
    try {
      // For now, just check if the user has verification status
      if (profile?.verificationStatus === 'VERIFIED') {
        return true;
      } else {
        setError('Document verification required');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to validate documents');
      return false;
    }
  }, [profile, setError]);

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    clearError();

    switch (state.currentStep) {
      case 'IDENTITY':
        return await validateIdentityStep();
      case 'DOCUMENTS':
        return await validateDocumentStep();
      case 'PAYMENT':
        // Payment validation would be handled by payment component
        return true;
      case 'SUMMARY':
        return true;
      default:
        return false;
    }
  }, [state.currentStep, validateIdentityStep, validateDocumentStep, clearError]);

  const determineInitialStep = useCallback(
    async (userProfile: UserProfile | null): Promise<BookingFlowStep> => {
      if (!userProfile) {
        return 'IDENTITY';
      }

      // Check if basic info is complete
      const hasBasicInfo = !!(userProfile.firstName && userProfile.lastName && userProfile.phone && userProfile.email);
      if (!hasBasicInfo) {
        return 'IDENTITY';
      }

      // Check if documents can be skipped
      try {
        const skip = await shouldSkipDocumentStep();
        if (skip) {
          return 'PAYMENT';
        }
      } catch (err) {
        console.warn('Failed to check document skip status:', err);
      }

      return 'DOCUMENTS';
    },
    [shouldSkipDocumentStep],
  );

  const initializeFlow = useCallback(async () => {
    if (state.isInitialized && profile) return;

    setLoading(true);
    clearError();

    try {
      // Fetch fresh profile data
      const freshProfile = await fetchProfile();

      // Determine the appropriate starting step
      const initialStep = await determineInitialStep(freshProfile);

      setState((prev) => ({
        ...prev,
        currentStep: initialStep,
        isInitialized: true,
        isLoading: false,
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to initialize booking flow');
    }
  }, [fetchProfile, determineInitialStep, setLoading, clearError, setError, state.isInitialized, profile]);

  const proceedToNextStep = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) {
      return;
    }

    const stepOrder: BookingFlowStep[] = ['IDENTITY', 'DOCUMENTS', 'PAYMENT', 'SUMMARY'];
    const currentIndex = stepOrder.indexOf(state.currentStep);

    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];

      // Special logic: skip documents if they're already verified
      if (nextStep === 'DOCUMENTS') {
        try {
          const skip = await shouldSkipDocumentStep();
          if (skip) {
            setState((prev) => ({ ...prev, currentStep: 'PAYMENT' }));
            return;
          }
        } catch (err) {
          console.warn('Failed to check document skip status:', err);
        }
      }

      setState((prev) => ({ ...prev, currentStep: nextStep }));
    }
  }, [state.currentStep, validateCurrentStep, shouldSkipDocumentStep]);

  const goToStep = useCallback((step: BookingFlowStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  // Update canProceedToNextStep based on current step validation
  useEffect(() => {
    const checkCanProceed = async () => {
      if (state.currentStep === 'SUMMARY') {
        setState((prev) => ({ ...prev, canProceedToNextStep: false }));
        return;
      }

      try {
        const canProceed = await validateCurrentStep();
        setState((prev) => ({ ...prev, canProceedToNextStep: canProceed }));
      } catch (err) {
        setState((prev) => ({ ...prev, canProceedToNextStep: false }));
      }
    };

    if (profile && !isLoading) {
      checkCanProceed();
    }
  }, [state.currentStep, profile, isLoading, validateCurrentStep]);

  return {
    ...state,
    profile, // Use profile from useUser hook
    isLoading,
    initializeFlow,
    proceedToNextStep,
    goToStep,
    validateCurrentStep,
    clearError,
  };
};
