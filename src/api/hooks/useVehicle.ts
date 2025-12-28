import { useState, useCallback, useRef, useEffect } from "react";
import { vehicleService } from "../services/vehicle";
import type {
  Vehicle,
  VehicleFilters,
  VehicleStats,
  VehicleEnums,
  VehicleBulkUpdateResponse,
  VehicleListResponse,
} from "@/common/interface/vehicleInterface";

interface UseVehicleReturn {
  vehicles: Vehicle[];
  vehicle: Vehicle | null;
  stats: VehicleStats | null;
  enums: VehicleEnums | null;
  pagination: Omit<VehicleListResponse, "vehicles"> | null;
  isLoading: boolean;
  error: string | null;

  fetchVehicles: (params?: VehicleFilters) => Promise<void>;
  fetchVehicleById: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchEnums: () => Promise<void>;
  createVehicle: (data: FormData) => Promise<Vehicle | null>;
  updateVehicle: (id: string, data: FormData) => Promise<Vehicle | null>;
  deleteVehicle: (id: string) => Promise<boolean>;
  toggleAvailability: (id: string) => Promise<Vehicle | null>;
  bulkUpdateAvailability: (
    ids: string[],
    isAvailable: boolean
  ) => Promise<VehicleBulkUpdateResponse | null>;
  clearError: () => void;
  resetVehicle: () => void;
}

export const useVehicle = (): UseVehicleReturn => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [enums, setEnums] = useState<VehicleEnums | null>(null);
  const [pagination, setPagination] = useState<Omit<
    VehicleListResponse,
    "vehicles"
  > | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // AbortController ref for cancelling pending requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => setError(null), []);
  const resetVehicle = useCallback(() => setVehicle(null), []);

  const fetchVehicles = useCallback(async (params?: VehicleFilters) => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await vehicleService.getAll(params);

      // API structure: { success: true, data: { vehicles: [...], total: ... } }
      // BaseApiService returns the whole body.
      // So response is the body.
      // We need to access response.data.vehicles

      if (response && response.data && response.data.vehicles) {
        setVehicles(response.data.vehicles);
        setPagination({
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit,
          totalPages: response.data.totalPages,
        });
      } else if (response && response.vehicles) {
        // Fallback if structure changes or is flattened
        setVehicles(response.vehicles);
        setPagination({
          total: response.total,
          page: response.page,
          limit: response.limit,
          totalPages: response.totalPages,
        });
      }
    } catch (err: any) {
      if (err.name !== "CanceledError") {
        setError(err.message || "Failed to fetch vehicles");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchVehicleById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await vehicleService.getById<Vehicle>(id);
      if (response.success && response.data) {
        setVehicle(response.data);
      } else {
        setError(response.message || "Failed to fetch vehicle details");
      }
    } catch (err: any) {
      setError(err.message || "Error fetching vehicle details");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await vehicleService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch stats:", err);
      // We often don't want to block the whole UI for stats failure, so maybe just log it
    }
  }, []);

  const fetchEnums = useCallback(async () => {
    try {
      const response = await vehicleService.getEnums();
      if (response.success && response.data) {
        setEnums(response.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch enums:", err);
    }
  }, []);

  const createVehicle = useCallback(
    async (data: FormData): Promise<Vehicle | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await vehicleService.createVehicle(data);
        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.message || "Failed to create vehicle");
          return null;
        }
      } catch (err: any) {
        setError(err.message || "Error creating vehicle");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateVehicle = useCallback(
    async (id: string, data: FormData): Promise<Vehicle | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await vehicleService.updateVehicle(id, data);
        if (response.success && response.data) {
          setVehicle(response.data);
          return response.data;
        } else {
          setError(response.message || "Failed to update vehicle");
          return null;
        }
      } catch (err: any) {
        setError(err.message || "Error updating vehicle");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteVehicle = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await vehicleService.deleteById<any>(id);
      if (response.success) {
        setVehicles((prev) => prev.filter((v) => v.id !== id));
        return true;
      } else {
        setError(response.message || "Failed to delete vehicle");
        return false;
      }
    } catch (err: any) {
      setError(err.message || "Error deleting vehicle");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleAvailability = useCallback(
    async (id: string): Promise<Vehicle | null> => {
      // Optimistic update could go here, but for now we'll wait for server
      try {
        const response = await vehicleService.toggleAvailability(id);
        if (response.success && response.data) {
          // Update vehicle in list
          setVehicles((prev) =>
            prev.map((v) => (v.id === id ? response.data! : v))
          );
          // Update single vehicle if selected
          if (vehicle && vehicle.id === id) {
            setVehicle(response.data);
          }
          return response.data;
        }
        return null;
      } catch (err: any) {
        setError(err.message || "Failed to toggle availability");
        return null;
      }
    },
    [vehicle]
  );

  const bulkUpdateAvailability = useCallback(
    async (
      ids: string[],
      isAvailable: boolean
    ): Promise<VehicleBulkUpdateResponse | null> => {
      setIsLoading(true);
      try {
        const response = await vehicleService.bulkUpdateAvailability(
          ids,
          isAvailable
        );
        if (response.success && response.data) {
          // Refresh list to show new statuses
          // Or manually update local state if we want to save a request
          // For now, let's just return the response
          return response.data;
        }
        return null;
      } catch (err: any) {
        setError(err.message || "Failed to bulk update availability");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    vehicles,
    vehicle,
    stats,
    enums,
    pagination,
    isLoading,
    error,
    fetchVehicles,
    fetchVehicleById,
    fetchStats,
    fetchEnums,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    toggleAvailability,
    bulkUpdateAvailability,
    clearError,
    resetVehicle,
  };
};
