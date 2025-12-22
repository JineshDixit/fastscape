import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types/expressTypes';
import * as bookingService from '../../services/booking/booking.service';
import { BaseController } from '../../utils/controller.utils';
import { sendSuccess, sendCreated } from '../../utils/response.utils';

class BookingController extends BaseController {
  /**
   * Create a new booking
   */
  createBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const bookingData = { ...req.body, userId };
    const booking = await bookingService.createBooking(bookingData);
    sendCreated(res, 'Booking created successfully', booking);
  });

  /**
   * Get user bookings
   */
  getUserBookings = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const bookings = await bookingService.getUserBookings(userId);
    sendSuccess(res, 'Bookings retrieved successfully', bookings);
  });

  /**
   * Get booking by ID
   */
  getBookingById = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const bookingId = this.getValidatedId(req, 'bookingId');
    const booking = await bookingService.getBookingById(bookingId, userId);
    sendSuccess(res, 'Booking retrieved successfully', booking);
  });

  /**
   * Update booking
   */
  updateBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const bookingId = this.getValidatedId(req, 'bookingId');
    const updateData = req.body;
    const booking = await bookingService.updateBooking(bookingId, userId, updateData);
    sendSuccess(res, 'Booking updated successfully', booking);
  });

  /**
   * Cancel booking
   */
  cancelBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const bookingId = this.getValidatedId(req, 'bookingId');
    await bookingService.cancelBooking(bookingId, userId);
    sendSuccess(res, 'Booking cancelled successfully');
  });
}

const bookingController = new BookingController();

export const {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBooking,
  cancelBooking
} = bookingController;