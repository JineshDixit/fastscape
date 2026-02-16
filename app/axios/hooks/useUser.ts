'use client';

import { useState, useCallback } from 'react';
import { userService } from '../services/user';
import type { UserProfile, UpdateProfileRequest } from '@/common/interfaces';

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

interface UseUserReturn extends UserState {
  fetchProfile: () => Promise<UserProfile | null>;
  updateProfile: (data: UpdateProfileRequest) => Promise<UserProfile | null>;
  checkEligibility: () => Promise<{
    eligible: boolean;
    reason?: string;
    restrictions?: any;
    missingDocuments?: string[];
    verificationStatus?: string;
  } | null>;
  clearError: () => void;
}

export const useUser = (): UseUserReturn => {
  const [state, setState] = useState<UserState>({
    profile: null,
    isLoading: false,
    error: null,
  });

  const clearError = useCallback(() => setState(prev => ({ ...prev, error: null })), []);

  const handleError = (error: any, fallbackMessage: string) => {
    setState(prev => ({ 
      ...prev, 
      error: error?.response?.data?.message || error?.message || fallbackMessage, 
      isLoading: false 
    }));
  };

  /**
   * Fetch user profile
   */
  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await userService.getProfile();
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          profile: response.data!, 
          isLoading: false 
        }));
        return response.data;
      } else {
        setState(prev => ({ 
          ...prev, 
          error: response.message || 'Failed to fetch profile', 
          isLoading: false 
        }));
        return null;
      }
    } catch (err: any) {
      handleError(err, 'Failed to fetch profile');
      return null;
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data: UpdateProfileRequest): Promise<UserProfile | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await userService.updateProfile(data);
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          profile: response.data!, 
          isLoading: false 
        }));
        return response.data;
      } else {
        setState(prev => ({ 
          ...prev, 
          error: response.message || 'Failed to update profile', 
          isLoading: false 
        }));
        return null;
      }
    } catch (err: any) {
      handleError(err, 'Failed to update profile');
      return null;
    }
  }, []);

  /**
   * Check booking eligibility
   */
  const checkEligibility = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await userService.checkBookingEligibility();
      setState(prev => ({ ...prev, isLoading: false }));
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setState(prev => ({ 
          ...prev, 
          error: response.message || 'Failed to check eligibility' 
        }));
        return null;
      }
    } catch (err: any) {
      handleError(err, 'Failed to check eligibility');
      return null;
    }
  }, []);

  return {
    ...state,
    fetchProfile,
    updateProfile,
    checkEligibility,
    clearError,
  };
};