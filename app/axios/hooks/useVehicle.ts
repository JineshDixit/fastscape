import { useCallback, useEffect, useRef } from 'react';
import { vehicleService } from '../services/vehicle';
import { useVehicleContext, VehicleState } from '@/app/context/VehicleContext';
import type { VehicleFilters, VehicleSearchParams } from '@/common/interfaces';

export const useVehicle = () => {
  const { setState, abortControllerRef, ...state } = useVehicleContext();

  const filtersRef = useRef(state.filters);

  // Sync ref with state
  useEffect(() => {
    filtersRef.current = state.filters;
  }, [state.filters]);

  const clearError = useCallback(() => setState((prev) => ({ ...prev, error: null })), [setState]);
  const resetVehicle = useCallback(() => setState((prev) => ({ ...prev, vehicle: null })), [setState]);

  const startLoading = useCallback(() => setState((prev) => ({ ...prev, isLoading: true, error: null })), [setState]);
  const stopLoading = useCallback(() => setState((prev) => ({ ...prev, isLoading: false })), [setState]);

  const handleError = useCallback(
    (error: any, fallbackMessage: string) => {
      if (error?.name !== 'AbortError') {
        setState((prev) => ({ ...prev, error: error?.message || fallbackMessage, isLoading: false }));
      } else {
        stopLoading();
      }
    },
    [setState, stopLoading],
  );

  /**
   * Fetch vehicle list (with filters & pagination)
   */
  const fetchVehicles = useCallback(
    async (newParams?: Partial<VehicleFilters>) => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      startLoading();

      try {
        // Merge new params with existing filters from REF to avoid stable closure/identity issues
        const mergedFilters = {
          ...filtersRef.current,
          ...newParams,
        };

        const response = await vehicleService.getVehicles(mergedFilters);

        if (response.success && response.data) {
          setState((prev) => ({
            ...prev,
            vehicles: response.data!.vehicles,
            pagination: {
              total: response.data!.total,
              page: response.data!.page,
              limit: response.data!.limit,
              totalPages: response.data!.totalPages,
            },
            filters: mergedFilters, // Persist the filters used
            isLoading: false,
          }));
        } else {
          setState((prev) => ({ ...prev, error: response.message || 'Failed to fetch vehicles', isLoading: false }));
        }
      } catch (err: any) {
        handleError(err, 'Failed to fetch vehicles');
      }
    },
    [abortControllerRef, startLoading, setState, handleError], // state.filters removed to break identity loop
  );

  const setFilters = useCallback(
    (newFilters: Partial<VehicleFilters>) => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, ...newFilters },
      }));
    },
    [setState],
  );

  /**
   * Search available vehicles with pickup/dropoff dates and location
   */
  const searchAvailableVehicles = useCallback(
    async (params: VehicleSearchParams) => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      startLoading();

      try {
        const response = await vehicleService.searchAvailableVehicles(params);

        if (response.success && response.data) {
          setState((prev) => ({
            ...prev,
            vehicles: response.data!.vehicles,
            pagination: {
              total: response.data!.total,
              page: response.data!.page,
              limit: response.data!.limit,
              totalPages: response.data!.totalPages,
            },
            isLoading: false,
          }));
        } else {
          setState((prev) => ({ ...prev, error: response.message || 'Failed to search vehicles', isLoading: false }));
        }
      } catch (err: any) {
        handleError(err, 'Failed to search vehicles');
      }
    },
    [abortControllerRef, startLoading, setState, handleError],
  );

  /**
   * Fetch vehicle by ID
   */
  const fetchVehicleById = useCallback(
    async (id: string) => {
      startLoading();

      try {
        const response = await vehicleService.getVehicleById(id);
        if (response.success && response.data) {
          setState((prev) => ({ ...prev, vehicle: response.data!, isLoading: false }));
        } else {
          setState((prev) => ({ ...prev, error: response.message || 'Vehicle not found', isLoading: false }));
        }
      } catch (err: any) {
        handleError(err, 'Failed to fetch vehicle');
      }
    },
    [startLoading, setState, handleError],
  );

  /**
   * Fetch vehicle stats
   */
  const fetchStats = useCallback(async () => {
    startLoading();
    try {
      const response = await vehicleService.getStats();
      if (response.success && response.data) {
        setState((prev) => ({ ...prev, stats: response.data!, isLoading: false }));
      } else {
        setState((prev) => ({ ...prev, error: response.message || 'Failed to fetch stats', isLoading: false }));
      }
    } catch (err: any) {
      handleError(err, 'Failed to fetch stats');
    }
  }, [startLoading, setState, handleError]);

  /**
   * Fetch body-type summary
   */
  const fetchBodyTypeSummary = useCallback(async () => {
    startLoading();
    try {
      const response = await vehicleService.getBodyTypeSummary();
      if (response.success && response.data) {
        setState((prev) => ({ ...prev, bodyTypeSummary: response.data!, isLoading: false }));
      } else {
        setState((prev) => ({ ...prev, error: response.message || 'Failed to fetch body types', isLoading: false }));
      }
    } catch (err: any) {
      handleError(err, 'Failed to fetch body types');
    }
  }, [startLoading, setState, handleError]);

  /**
   * Fetch filter metadata (sidebar filters)
   */
  const fetchFilterMetadata = useCallback(async () => {
    startLoading();
    try {
      const response = await vehicleService.getFilterMetadata();
      if (response.success && response.data) {
        setState((prev) => ({ ...prev, filterMetadata: response.data!, isLoading: false }));
      } else {
        setState((prev) => ({ ...prev, error: response.message || 'Failed to fetch filters', isLoading: false }));
      }
    } catch (err: any) {
      handleError(err, 'Failed to fetch filters');
    }
  }, [startLoading, setState, handleError]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    const currentAbortController = abortControllerRef.current;
    return () => currentAbortController?.abort();
  }, [abortControllerRef]);

  /**
   * Update booking data (dates, location, type)
   */
  const setBookingData = useCallback(
    (data: Partial<VehicleState['bookingData']>) => {
      setState((prev) => ({
        ...prev,
        bookingData: { ...prev.bookingData, ...data },
      }));
    },
    [setState],
  );

  return {
    ...state,
    fetchVehicles,
    searchAvailableVehicles,
    fetchVehicleById,
    fetchStats,
    fetchBodyTypeSummary,
    fetchFilterMetadata,
    clearError,
    resetVehicle,
    setBookingData,
    setFilters,
  };
};
