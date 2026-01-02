'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { VehicleService } from '../services/vehicle';
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

interface UseVehicleReturn {
  vehicles: Vehicle[];
  vehicle: Vehicle | null;
  stats: VehicleStats | null;
  bodyTypeSummary: BodyTypeSummary[];
  filterMetadata: FilterMetadata | null;
  pagination: Omit<VehicleListResponse, 'vehicles'> | null;
  isLoading: boolean;
  error: string | null;

  fetchVehicles: (params?: VehicleFilters) => Promise<void>;
  fetchVehicleById: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchBodyTypeSummary: () => Promise<void>;
  fetchFilterMetadata: () => Promise<void>;
  clearError: () => void;
  resetVehicle: () => void;
}

const vehicleService = new VehicleService();

export const useVehicle = (): UseVehicleReturn => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [bodyTypeSummary, setBodyTypeSummary] = useState<BodyTypeSummary[]>([]);
  const [filterMetadata, setFilterMetadata] = useState<FilterMetadata | null>(null);
  const [pagination, setPagination] =
    useState<Omit<VehicleListResponse, 'vehicles'> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => setError(null), []);
  const resetVehicle = useCallback(() => setVehicle(null), []);

  /**
   * Fetch vehicle list (with filters & pagination)
   */
  const fetchVehicles = useCallback(async (params?: VehicleFilters) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await vehicleService.getAll(params);

      if (response.success && response.data) {
        setVehicles(response.data.vehicles);
        setPagination({
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit,
          totalPages: response.data.totalPages,
        });
      } else {
        setError(response.message || 'Failed to fetch vehicles');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch vehicles');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch vehicle by ID
   */
  const fetchVehicleById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await vehicleService.getById<Vehicle>(id);
      if (response.success && response.data) {
        setVehicle(response.data);
      } else {
        setError(response.message || 'Vehicle not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vehicle');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch vehicle stats
   */
  const fetchStats = useCallback(async () => {
    try {
      const response = await vehicleService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  }, []);

  /**
   * Fetch body-type summary
   */
  const fetchBodyTypeSummary = useCallback(async () => {
    try {
      const response = await vehicleService.getBodyTypeSummary();
      if (response.success && response.data) {
        setBodyTypeSummary(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch body type summary', err);
    }
  }, []);

  /**
   * Fetch filter metadata (sidebar filters)
   */
  const fetchFilterMetadata = useCallback(async () => {
    try {
      const response = await vehicleService.getFilterMetadata();
      if (response.success && response.data) {
        setFilterMetadata(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch filter metadata', err);
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  return {
    vehicles,
    vehicle,
    stats,
    bodyTypeSummary,
    filterMetadata,
    pagination,
    isLoading,
    error,
    fetchVehicles,
    fetchVehicleById,
    fetchStats,
    fetchBodyTypeSummary,
    fetchFilterMetadata,
    clearError,
    resetVehicle,
  };
};
