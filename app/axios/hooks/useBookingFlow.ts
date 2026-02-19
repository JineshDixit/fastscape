'use client';

import { useState, useCallback, useEffect } from 'react';
import { useUser } from './useUser';
import { useDocument } from './useDocument';
import { useBooking } from './useBooking';
import { useVehicle } from './useVehicle';
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
  goToStepWithCleanup: (step: BookingFlowStep) => void;
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
  const { bookingData } = useVehicle();

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

    // Check if driving info is complete
    const hasDrivingInfo = !!(
      profile.licenseIssuingCountry &&
      profile.licenseExpiryDate &&
      profile.drivingExperienceYears !== undefined
    );

    if (!hasDrivingInfo) {
      setError('Please provide your driving license information');
      return false;
    }

    // Check if license is not expired
    if (profile.licenseExpiryDate) {
      const expiryDate = new Date(profile.licenseExpiryDate);
      if (expiryDate <= new Date()) {
        setError('Your driving license has expired');
        return false;
      }
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
      console.log('[useBookingFlow] Determining initial step for profile:', userProfile);

      if (!userProfile) {
        console.log('[useBookingFlow] No profile, starting at IDENTITY');
        return 'IDENTITY';
      }

      // Check if basic info is complete
      const hasBasicInfo = !!(userProfile.firstName && userProfile.lastName && userProfile.phone && userProfile.email);
      if (!hasBasicInfo) {
        console.log('[useBookingFlow] Basic info incomplete, starting at IDENTITY');
        return 'IDENTITY';
      }

      // Check if driving info is complete
      const hasDrivingInfo = !!(
        userProfile.licenseIssuingCountry &&
        userProfile.licenseExpiryDate &&
        userProfile.drivingExperienceYears !== undefined
      );
      if (!hasDrivingInfo) {
        console.log('[useBookingFlow] Driving info incomplete, starting at IDENTITY');
        return 'IDENTITY';
      }

      // Check if license is not expired
      if (userProfile.licenseExpiryDate) {
        const expiryDate = new Date(userProfile.licenseExpiryDate);
        if (expiryDate <= new Date()) {
          console.log('[useBookingFlow] License expired, starting at IDENTITY');
          return 'IDENTITY';
        }
      }

      // Check if documents can be skipped
      try {
        const skip = await shouldSkipDocumentStep(bookingData.bookingType);
        console.log('[useBookingFlow] Should skip documents?', skip);
        if (skip) {
          // Documents are verified, but we still need to start at IDENTITY
          // The booking will be created when user clicks "Proceed" from identity step
          console.log('[useBookingFlow] Documents verified, but starting at IDENTITY (booking not created yet)');
          return 'IDENTITY';
        }
      } catch (err) {
        console.warn('Failed to check document skip status:', err);
      }

      console.log('[useBookingFlow] Starting at DOCUMENTS');
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
    console.log('[useBookingFlow] proceedToNextStep called, current step:', state.currentStep);

    const isValid = await validateCurrentStep();
    if (!isValid) {
      console.log('[useBookingFlow] Current step validation failed');
      return;
    }

    const stepOrder: BookingFlowStep[] = ['IDENTITY', 'DOCUMENTS', 'PAYMENT', 'SUMMARY'];
    const currentIndex = stepOrder.indexOf(state.currentStep);

    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      console.log('[useBookingFlow] Next step would be:', nextStep);

      // Special logic: skip documents if they're already verified
      if (nextStep === 'DOCUMENTS') {
        try {
          const skip = await shouldSkipDocumentStep(bookingData.bookingType);
          console.log('[useBookingFlow] Should skip documents?', skip);
          if (skip) {
            console.log('[useBookingFlow] Skipping to PAYMENT');
            setState((prev) => ({ ...prev, currentStep: 'PAYMENT' }));
            return;
          }
        } catch (err) {
          console.warn('Failed to check document skip status:', err);
        }
      }

      console.log('[useBookingFlow] Moving to step:', nextStep);
      setState((prev) => ({ ...prev, currentStep: nextStep }));
    }
  }, [state.currentStep, validateCurrentStep, shouldSkipDocumentStep]);

  const goToStep = useCallback((step: BookingFlowStep) => {
    console.log('[useBookingFlow] Manually navigating to step:', step);
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  // Enhanced step navigation that handles booking state
  const goToStepWithCleanup = useCallback((step: BookingFlowStep) => {
    console.log('[useBookingFlow] Navigating to step with cleanup:', step);
    
    // If going back to earlier steps, we might need to clear some state
    const stepOrder: BookingFlowStep[] = ['IDENTITY', 'DOCUMENTS', 'PAYMENT', 'SUMMARY'];
    const currentIndex = stepOrder.indexOf(state.currentStep);
    const targetIndex = stepOrder.indexOf(step);
    
    if (targetIndex < currentIndex) {
      console.log('[useBookingFlow] Going backwards, clearing error state');
      setState((prev) => ({ ...prev, currentStep: step, error: null }));
    } else {
      setState((prev) => ({ ...prev, currentStep: step }));
    }
  }, [state.currentStep]);

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
    goToStepWithCleanup,
    validateCurrentStep,
    clearError,
  };
};
