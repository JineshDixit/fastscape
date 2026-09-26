import { useState, useCallback, useEffect } from 'react';
import { locationService } from '../services/location';
import type { Location } from '../../../common/interfaces';

export interface UseLocationReturn {
  locations: Location[];
  isLoading: boolean;
  error: string | null;
  fetchLocations: () => Promise<void>;
}

export const useLocation = (): UseLocationReturn => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await locationService.getLocations();

      if (response.success && response.data) {
        setLocations(response.data);
      } else {
        setError(response.message || 'Failed to fetch locations');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching locations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return {
    locations,
    isLoading,
    error,
    fetchLocations,
  };
};
