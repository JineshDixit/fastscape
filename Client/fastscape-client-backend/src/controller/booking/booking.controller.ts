import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types/expressTypes';
import * as bookingService from '../../services/booking/booking.service';
import { BaseController } from '../../utils/controller.utils';
import { sendSuccess, sendCreated } from '../../utils/response.utils';
import Logger from '../../utils/logger';

class BookingController extends BaseController {
  /**
   * Create a new booking
   */
  createBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const bookingData = { ...req.body, userId };

    Logger.info(`Creating ${bookingData.bookingType || 'UNKNOWN'} booking`, { userId, bookingData });

    const booking = await bookingService.createBooking(bookingData);

    Logger.info(`Booking created successfully: ${booking.id} (${booking.bookingType})`, {
      bookingId: booking.id,
      userId,
    });

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
   * Get upcoming bookings (next 30 days)
   */
  getUpcomingBookings = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const bookings = await bookingService.getUpcomingBookings(userId);
    sendSuccess(res, 'Upcoming bookings retrieved successfully', bookings);
  });

  /**
   * Get active bookings (currently ongoing)
   */
  getActiveBookings = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const bookings = await bookingService.getActiveBookings(userId);
    sendSuccess(res, 'Active bookings retrieved successfully', bookings);
  });

  /**
   * Get booking statistics
   */
  getBookingStats = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const stats = await bookingService.getBookingStats(userId);
    sendSuccess(res, 'Booking statistics retrieved successfully', stats);
  });

  /**
   * Get booking history with filters
   */
  getBookingHistory = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const { year, month, status, vehicleType } = req.query;
    const params = {
      year: year ? parseInt(year as string) : undefined,
      month: month ? parseInt(month as string) : undefined,
      status: status as string,
      vehicleType: vehicleType as string,
    };
    const bookings = await bookingService.getBookingHistory(userId, params);
    sendSuccess(res, 'Booking history retrieved successfully', bookings);
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
  getUpcomingBookings,
  getActiveBookings,
  getBookingStats,
  getBookingHistory,
  getBookingById,
  updateBooking,
  cancelBooking,
} = bookingController;
