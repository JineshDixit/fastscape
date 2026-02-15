'use client';

import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';
import type { Vehicle, VehicleStats, VehicleListResponse, VehicleFilters } from '@/common/interfaces';

interface BodyTypeSummary {
  bodyType: string;
  count: number;
  models?: string[];
}

interface FilterMetadata {
  bodyTypes: { bodyType: string; count: number; models: string[] }[];
  brands: { make: string; count: number; models: string[] }[];
}

export interface VehicleState {
  vehicles: Vehicle[];
  vehicle: Vehicle | null;
  mostPopularCar: (Vehicle & { bookingCount: number }) | null;
  stats: VehicleStats | null;
  bodyTypeSummary: BodyTypeSummary[];
  filterMetadata: FilterMetadata | null;
  pagination: Omit<VehicleListResponse, 'vehicles'> | null;
  bookingData: {
    pickupDate: string | null;
    dropoffDate: string | null;
    pickupLocation: string | null;
    dropoffLocation: string | null;
    bookingType: 'SELF_DRIVE' | 'CHAUFFEUR';
  };
  isLoading: boolean;
  error: string | null;
  filters: VehicleFilters;
}

interface VehicleContextType extends VehicleState {
  setState: React.Dispatch<React.SetStateAction<VehicleState>>;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
}

const initialState: VehicleState = {
  vehicles: [],
  vehicle: null,
  mostPopularCar: null,
  stats: null,
  bodyTypeSummary: [],
  filterMetadata: null,
  pagination: null,
  bookingData: {
    pickupDate: null,
    dropoffDate: null,
    pickupLocation: null,
    dropoffLocation: null,
    bookingType: 'SELF_DRIVE',
  },
  isLoading: false,
  error: null,
  filters: {
    page: 1,
    limit: 12,
  },
};

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const VehicleProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<VehicleState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  return (
    <VehicleContext.Provider value={{ ...state, setState, abortControllerRef }}>{children}</VehicleContext.Provider>
  );
};

export const useVehicleContext = () => {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicleContext must be used within a VehicleProvider');
  }
  return context;
};
