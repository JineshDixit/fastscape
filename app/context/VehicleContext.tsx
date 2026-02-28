'use client';

import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
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

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

// Helper function to get initial booking data from localStorage
const getInitialBookingData = () => {
  if (typeof window === 'undefined') {
    return {
      pickupDate: null,
      dropoffDate: null,
      pickupLocation: null,
      dropoffLocation: null,
      bookingType: 'SELF_DRIVE' as const,
    };
  }

  try {
    const stored = localStorage.getItem('vehicleBookingData');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        pickupDate: parsed.pickupDate || null,
        dropoffDate: parsed.dropoffDate || null,
        pickupLocation: parsed.pickupLocation || null,
        dropoffLocation: parsed.dropoffLocation || null,
        bookingType: parsed.bookingType || 'SELF_DRIVE',
      };
    }
  } catch (error) {
    console.warn('Failed to parse stored booking data:', error);
  }

  return {
    pickupDate: null,
    dropoffDate: null,
    pickupLocation: null,
    dropoffLocation: null,
    bookingType: 'SELF_DRIVE' as const,
  };
};

const initialState: VehicleState = {
  vehicles: [],
  vehicle: null,
  mostPopularCar: null,
  stats: null,
  bodyTypeSummary: [],
  filterMetadata: null,
  pagination: null,
  bookingData: getInitialBookingData(),
  isLoading: false,
  error: null,
  filters: {
    page: 1,
    limit: 12,
  },
};

export const VehicleProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<VehicleState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Persist booking data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vehicleBookingData', JSON.stringify(state.bookingData));
    }
  }, [state.bookingData]);

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
