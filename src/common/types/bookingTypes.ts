export interface CreateBookingData {
  userId: string;
  vehicleId: string;
  startDatetime: Date;
  endDatetime: Date;
  pickupLocation: string;
  dropoffLocation: string;
}

export interface UpdateBookingData {
  startDatetime?: Date;
  endDatetime?: Date;
  pickupLocation?: string;
  dropoffLocation?: string;
}