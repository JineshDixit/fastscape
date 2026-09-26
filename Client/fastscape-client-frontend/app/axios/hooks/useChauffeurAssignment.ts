import { useCallback, useState } from 'react';
import { chauffeurAssignmentService, type AssignmentStatusResponse } from '../services/chauffeurAssignment';

export const useChauffeurAssignment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const checkAssignmentStatus = useCallback(async (bookingId: string): Promise<AssignmentStatusResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await chauffeurAssignmentService.checkAssignmentStatus(bookingId);

      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.message || 'Failed to check assignment status');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to check assignment status';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    clearError,
    checkAssignmentStatus,
  };
};
