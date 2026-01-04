'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { vehicleService } from '../services/vehicle';
import type {
  Vehicle,
  VehicleFilters,
  VehicleStats,
  VehicleListResponse,
} from '@/common/interfaces';

interface BodyTypeSummary {
  bodyType: string;
  count: number;
}

interface FilterMetadata {
  bodyTypes: BodyTypeSummary[];
  brands: { make: string; count: number }[];
}

interface VehicleState {
  vehicles: Vehicle[];
  vehicle: Vehicle | null;
  stats: VehicleStats | null;
  bodyTypeSummary: BodyTypeSummary[];
  filterMetadata: FilterMetadata | null;
  pagination: Omit<VehicleListResponse, 'vehicles'> | null;
  isLoading: boolean;
  error: string | null;
}

interface UseVehicleReturn extends VehicleState {
  fetchVehicles: (params?: VehicleFilters) => Promise<void>;
  fetchVehicleById: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchBodyTypeSummary: () => Promise<void>;
  fetchFilterMetadata: () => Promise<void>;
  clearError: () => void;
  resetVehicle: () => void;
}

export const useVehicle = (): UseVehicleReturn => {
  const [state, setState] = useState<VehicleState>({
    vehicles: [],
    vehicle: null,
    stats: null,
    bodyTypeSummary: [],
    filterMetadata: null,
    pagination: null,
    isLoading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => setState(prev => ({ ...prev, error: null })), []);
  const resetVehicle = useCallback(() => setState(prev => ({ ...prev, vehicle: null })), []);

  const startLoading = () => setState(prev => ({ ...prev, isLoading: true, error: null }));
  const stopLoading = () => setState(prev => ({ ...prev, isLoading: false }));
  const handleError = (error: any, fallbackMessage: string) => {
    if (error?.name !== 'AbortError') {
      setState(prev => ({ ...prev, error: error?.message || fallbackMessage, isLoading: false }));
    } else {
      stopLoading();
    }
  };

  /**
   * Fetch vehicle list (with filters & pagination)
   */
  const fetchVehicles = useCallback(async (params?: VehicleFilters) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    startLoading();

    try {
      const response = await vehicleService.getVehicles(params);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          vehicles: response.data!.vehicles,
          pagination: {
            total: response.data!.total,
            page: response.data!.page,
            limit: response.data!.limit,
            totalPages: response.data!.totalPages,
          },
          isLoading: false
        }));
      } else {
        setState(prev => ({ ...prev, error: response.message || 'Failed to fetch vehicles', isLoading: false }));
      }
    } catch (err: any) {
      handleError(err, 'Failed to fetch vehicles');
    }
  }, []);

  /**
   * Fetch vehicle by ID
   */
  const fetchVehicleById = useCallback(async (id: string) => {
    startLoading();

    try {
      const response = await vehicleService.getVehicleById(id);
      if (response.success && response.data) {
        setState(prev => ({ ...prev, vehicle: response.data!, isLoading: false }));
      } else {
        setState(prev => ({ ...prev, error: response.message || 'Vehicle not found', isLoading: false }));
      }
    } catch (err: any) {
      handleError(err, 'Failed to fetch vehicle');
    }
  }, []);

  /**
   * Fetch vehicle stats
   */
  const fetchStats = useCallback(async () => {
    startLoading();
    try {
      const response = await vehicleService.getStats();
      if (response.success && response.data) {
        setState(prev => ({ ...prev, stats: response.data!, isLoading: false }));
      } else {
        setState(prev => ({ ...prev, error: response.message || 'Failed to fetch stats', isLoading: false }));
      }
    } catch (err: any) {
      handleError(err, 'Failed to fetch stats');
    }
  }, []);

  /**
   * Fetch body-type summary
   */
  const fetchBodyTypeSummary = useCallback(async () => {
    startLoading();
    try {
      const response = await vehicleService.getBodyTypeSummary();
      if (response.success && response.data) {
        setState(prev => ({ ...prev, bodyTypeSummary: response.data!, isLoading: false }));
      } else {
        setState(prev => ({ ...prev, error: response.message || 'Failed to fetch body types', isLoading: false }));
      }
    } catch (err: any) {
      handleError(err, 'Failed to fetch body types');
    }
  }, []);

  /**
   * Fetch filter metadata (sidebar filters)
   */
  const fetchFilterMetadata = useCallback(async () => {
    startLoading();
    try {
      const response = await vehicleService.getFilterMetadata();
      if (response.success && response.data) {
        setState(prev => ({ ...prev, filterMetadata: response.data!, isLoading: false }));
      } else {
        setState(prev => ({ ...prev, error: response.message || 'Failed to fetch filters', isLoading: false }));
      }
    } catch (err: any) {
      handleError(err, 'Failed to fetch filters');
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  return {
    ...state,
    fetchVehicles,
    fetchVehicleById,
    fetchStats,
    fetchBodyTypeSummary,
    fetchFilterMetadata,
    clearError,
    resetVehicle,
  };
};
