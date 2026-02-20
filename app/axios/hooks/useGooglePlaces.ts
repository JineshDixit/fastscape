import { useState, useEffect, useCallback, useRef } from 'react';
import { locationService, type PlacePrediction } from '../services/location';

export interface UseGooglePlacesOptions {
  debounceMs?: number;
  restrictToDubai?: boolean;
}

export interface UseGooglePlacesReturn {
  predictions: PlacePrediction[];
  isLoading: boolean;
  error: string | null;
  searchPlaces: (query: string) => void;
  clearPredictions: () => void;
}

export const useGooglePlaces = (options: UseGooglePlacesOptions = {}): UseGooglePlacesReturn => {
  const { debounceMs = 300, restrictToDubai = true } = options;

  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchPlaces = useCallback(
    (query: string) => {
      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Clear predictions if query is empty or too short
      if (!query || query.trim().length < 3) {
        setPredictions([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Debounce the search
      debounceTimerRef.current = setTimeout(async () => {
        try {
          // Create new abort controller for this request
          abortControllerRef.current = new AbortController();

          const response = await locationService.getPlacesAutocomplete(query, restrictToDubai);

          if (response.success && response.data) {
            setPredictions(response.data);
            setError(null);
          } else {
            setPredictions([]);
            setError(response.message || 'Failed to fetch place suggestions');
          }
        } catch (err: any) {
          // Ignore abort errors
          if (err.name === 'AbortError' || err.name === 'CanceledError') {
            return;
          }

          console.error('Error searching places:', err);
          setPredictions([]);
          setError(err.message || 'An error occurred while searching');
        } finally {
          setIsLoading(false);
        }
      }, debounceMs);
    },
    [debounceMs, restrictToDubai],
  );

  const clearPredictions = useCallback(() => {
    setPredictions([]);
    setError(null);
    setIsLoading(false);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    predictions,
    isLoading,
    error,
    searchPlaces,
    clearPredictions,
  };
};

export { PlacePrediction };
