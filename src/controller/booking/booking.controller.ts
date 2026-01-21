import { Response } from 'express';
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
   * Check vehicle availability for specific dates
   */
  checkAvailability = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { vehicleId, startDatetime, endDatetime } = req.body;
    const availability = await bookingService.checkVehicleAvailability(
      vehicleId,
      new Date(startDatetime),
      new Date(endDatetime)
    );
    sendSuccess(res, 'Vehicle availability checked', availability);
  });

  /**
   * Confirm a booking
   */
  confirmBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const bookingId = this.getValidatedId(req, 'bookingId');
    const confirmationData = { ...req.body, userId };
    const booking = await bookingService.confirmBooking(bookingId, confirmationData);
    sendSuccess(res, 'Booking confirmed successfully', booking);
  });

  /**
   * Start booking (vehicle pickup)
   */
  startBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const bookingId = this.getValidatedId(req, 'bookingId');
    const booking = await bookingService.startBooking(bookingId, userId);
    sendSuccess(res, 'Booking started successfully', booking);
  });

  /**
   * Complete booking (vehicle dropoff)
   */
  completeBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const bookingId = this.getValidatedId(req, 'bookingId');
    const { actualDropoffDatetime } = req.body;
    const booking = await bookingService.completeBooking(
      bookingId, 
      userId, 
      actualDropoffDatetime ? new Date(actualDropoffDatetime) : undefined
    );
    sendSuccess(res, 'Booking completed successfully', booking);
  });

  /**
   * Get user bookings with filtering
   */
  getUserBookings = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const filters = {
      status: req.query.status as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      vehicleType: req.query.vehicleType as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };
    const result = await bookingService.getUserBookings(userId, filters);
    sendSuccess(res, 'Bookings retrieved successfully', result);
  });

  /**
   * Get upcoming bookings
   */
  getUpcomingBookings = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const bookings = await bookingService.getUpcomingBookings(userId);
    sendSuccess(res, 'Upcoming bookings retrieved successfully', bookings);
  });

  /**
   * Get active bookings
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
    const stats = await bookingService.getUserBookingStats(userId);
    sendSuccess(res, 'Booking statistics retrieved successfully', stats);
  });

  /**
   * Get booking history
   */
  getBookingHistory = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const filters = {
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      month: req.query.month ? parseInt(req.query.month as string) : undefined,
      status: req.query.status as string,
      vehicleType: req.query.vehicleType as string,
    };
    const bookings = await bookingService.getBookingHistory(userId, filters);
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
   * Extend booking duration
   */
  extendBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const bookingId = this.getValidatedId(req, 'bookingId');
    const { newEndDatetime } = req.body;
    const result = await bookingService.extendBooking(bookingId, userId, new Date(newEndDatetime));
    sendSuccess(res, 'Booking extended successfully', result);
  });

  /**
   * Cancel booking
   */
  cancelBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const bookingId = this.getValidatedId(req, 'bookingId');
    const { cancellationReason } = req.body;
    const result = await bookingService.cancelBooking(bookingId, userId, cancellationReason);
    sendSuccess(res, 'Booking cancelled successfully', result);
  });
}

const bookingController = new BookingController();

export const { 
  createBooking, 
  checkAvailability,
  confirmBooking,
  startBooking,
  completeBooking,
  getUserBookings, 
  getUpcomingBookings,
  getActiveBookings,
  getBookingStats,
  getBookingHistory,
  getBookingById, 
  updateBooking, 
  extendBooking,
  cancelBooking 
} = bookingController;
