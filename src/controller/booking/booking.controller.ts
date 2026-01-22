import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/expressTypes';
import * as bookingService from '../../services/booking/booking.service';
import { BaseController } from '../../utils/controller.utils';
import { sendSuccess, sendCreated } from '../../utils/response.utils';
import Logger from '../../utils/logger';

// Simple in-memory cache for booking progress (in production, use Redis)
interface BookingProgress {
  userId: string;
  bookingType: string;
  currentStep: number;
  data: any;
  lastUpdated: Date;
  expiresAt: Date;
}

class BookingProgressCache {
  private cache = new Map<string, BookingProgress>();

  set(key: string, value: BookingProgress): void {
    this.cache.set(key, value);
  }

  get(key: string): BookingProgress | undefined {
    return this.cache.get(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clean up expired entries
  cleanup(): void {
    const now = new Date();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Global instance (in production, use Redis)
const bookingProgressCache = new BookingProgressCache();

class BookingController extends BaseController {
  /**
   * Create a new booking with enhanced address integration
   * Supports both saved addresses and new address creation
   * Requirements: 2.1, 2.2, 2.4, 6.1, 6.2
   */
  createEnhancedBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const enhancedBookingData = { ...req.body, userId };

    Logger.info('Creating enhanced booking with address integration', {
      userId,
      vehicleId: enhancedBookingData.vehicleId,
      hasPickupAddressId: !!enhancedBookingData.pickupAddressId,
      hasDropoffAddressId: !!enhancedBookingData.dropoffAddressId,
      useNewPickupAddress: enhancedBookingData.useNewPickupAddress,
      useNewDropoffAddress: enhancedBookingData.useNewDropoffAddress,
    });

    const booking = await bookingService.createBookingWithAddresses(enhancedBookingData);
    sendCreated(res, 'Enhanced booking created successfully', booking);
  });

  /**
   * Create a new booking (legacy endpoint - maintained for backward compatibility)
   */
  createBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const bookingData = { ...req.body, userId };
    const booking = await bookingService.createBooking(bookingData);
    sendCreated(res, 'Booking created successfully', booking);
  });

  /**
   * Get booking quote without persistence
   */
  getBookingQuote = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const quote = await bookingService.getBookingQuote(req.body);
    sendSuccess(res, 'Booking quote generated', quote);
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

  /**
   * Get customized booking flow steps based on user profile completeness
   * Requirements: 6.1, 6.2, 6.3
   */
  getBookingFlowSteps = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const { bookingType = 'SELF_DRIVE' } = req.query;

    Logger.info('Getting booking flow steps', { userId, bookingType });

    const flowSteps = await bookingService.getBookingFlowSteps(userId, bookingType as string);
    sendSuccess(res, 'Booking flow steps retrieved successfully', {
      steps: flowSteps,
      totalSteps: flowSteps.length,
      estimatedTime: flowSteps.reduce((total, step) => total + step.estimatedTime, 0),
    });
  });

  /**
   * Check booking eligibility based on profile completeness
   * Requirements: 6.1, 6.2
   */
  checkBookingEligibility = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const { bookingType = 'SELF_DRIVE' } = req.query;

    Logger.info('Checking booking eligibility', { userId, bookingType });

    const eligibility = await bookingService.checkBookingEligibilityEnhanced(userId, bookingType as string);
    sendSuccess(res, 'Booking eligibility checked successfully', eligibility);
  });

  /**
   * Get user addresses formatted for booking selection
   * Requirements: 2.1
   */
  getAddressesForBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);

    Logger.info('Getting addresses for booking selection', { userId });

    const addresses = await bookingService.getAddressesForBooking(userId);
    sendSuccess(res, 'Addresses for booking retrieved successfully', {
      addresses,
      count: addresses.length,
      hasDefault: addresses.some(addr => addr.isDefault),
    });
  });

  /**
   * Save booking progress for later resumption
   * Requirements: 6.4
   */
  saveBookingProgress = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const { step, data, bookingType = 'SELF_DRIVE' } = req.body;

    Logger.info('Saving booking progress', { userId, step, bookingType });

    // Clean up expired entries periodically
    bookingProgressCache.cleanup();

    const progressKey = `booking_progress_${userId}_${bookingType}`;
    const progressData: BookingProgress = {
      userId,
      bookingType,
      currentStep: step,
      data,
      lastUpdated: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    bookingProgressCache.set(progressKey, progressData);

    sendSuccess(res, 'Booking progress saved successfully', {
      step,
      saved: true,
      expiresAt: progressData.expiresAt,
    });
  });

  /**
   * Resume booking progress from saved state
   * Requirements: 6.4
   */
  resumeBookingProgress = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const { bookingType = 'SELF_DRIVE' } = req.query;

    Logger.info('Resuming booking progress', { userId, bookingType });

    const progressKey = `booking_progress_${userId}_${bookingType}`;
    const progressData = bookingProgressCache.get(progressKey);

    if (!progressData) {
      sendSuccess(res, 'No saved booking progress found', {
        hasProgress: false,
        progress: null,
      });
      return;
    }

    // Check if progress has expired
    if (new Date() > progressData.expiresAt) {
      bookingProgressCache.delete(progressKey);
      sendSuccess(res, 'Saved booking progress has expired', {
        hasProgress: false,
        progress: null,
      });
      return;
    }

    sendSuccess(res, 'Booking progress resumed successfully', {
      hasProgress: true,
      progress: {
        currentStep: progressData.currentStep,
        data: progressData.data,
        lastUpdated: progressData.lastUpdated,
        expiresAt: progressData.expiresAt,
      },
    });
  });

  /**
   * Clear saved booking progress
   * Requirements: 6.4
   */
  clearBookingProgress = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = this.ensureAuthenticated(req);
    const { bookingType = 'SELF_DRIVE' } = req.query;

    Logger.info('Clearing booking progress', { userId, bookingType });

    const progressKey = `booking_progress_${userId}_${bookingType}`;
    const wasDeleted = bookingProgressCache.delete(progressKey);

    sendSuccess(res, 'Booking progress cleared successfully', {
      cleared: wasDeleted,
    });
  });
}

const bookingController = new BookingController();

export const {
  createBooking,
  createEnhancedBooking,
  getBookingQuote,
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
  cancelBooking,
  getBookingFlowSteps,
  checkBookingEligibility,
  getAddressesForBooking,
  saveBookingProgress,
  resumeBookingProgress,
  clearBookingProgress
} = bookingController;
