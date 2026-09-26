'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Booking, BookingStats, PaymentBreakdown, PaymentSummary } from '@/common/interfaces';

export interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  upcomingBookings: Booking[];
  activeBookings: Booking[];
  bookingStats: BookingStats | null;
  bookingHistory: Booking[];
  paymentBreakdown: PaymentBreakdown | null;
  paymentSummary: PaymentSummary | null;
  isFetchingInfo: boolean;
  isCreatingBooking: boolean;
  isProcessingPayment: boolean;
  error: string | null;
  clientSecret: string | null;
  intentId: string | null;
}

interface BookingContextType extends BookingState {
  setState: React.Dispatch<React.SetStateAction<BookingState>>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const initialState: BookingState = {
  bookings: [],
  currentBooking: null,
  upcomingBookings: [],
  activeBookings: [],
  bookingStats: null,
  bookingHistory: [],
  paymentBreakdown: null,
  paymentSummary: null,
  isFetchingInfo: false,
  isCreatingBooking: false,
  isProcessingPayment: false,
  error: null,
  clientSecret: null,
  intentId: null,
};

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<BookingState>(initialState);

  return <BookingContext.Provider value={{ ...state, setState }}>{children}</BookingContext.Provider>;
};

export const useBookingContext = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookingContext must be used within a BookingProvider');
  }
  return context;
};
