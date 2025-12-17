import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types/expressTypes';
import * as bookingService from '../../services/booking/booking.service';
import { createError } from '../../services/middleware/errorHandler';

/**
 * Create a new booking
 */
export const createBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw createError('Unauthorized', 401);
    }
    
    const bookingData = { ...req.body, userId: req.user.id };
    const booking = await bookingService.createBooking(bookingData);
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user bookings
 */
export const getUserBookings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw createError('Unauthorized', 401);
    }
    
    const bookings = await bookingService.getUserBookings(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking by ID
 */
export const getBookingById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw createError('Unauthorized', 401);
    }
    
    const { bookingId } = req.params;
    const booking = await bookingService.getBookingById(bookingId, req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Booking retrieved successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update booking
 */
export const updateBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw createError('Unauthorized', 401);
    }
    
    const { bookingId } = req.params;
    const updateData = req.body;
    const booking = await bookingService.updateBooking(bookingId, req.user.id, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel booking
 */
export const cancelBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw createError('Unauthorized', 401);
    }
    
    const { bookingId } = req.params;
    await bookingService.cancelBooking(bookingId, req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};