import { Request, Response } from 'express';
import * as bookingService from '../../services/booking/booking.service';

/**
 * GET /api/bookings
 * Get all bookings with filters and pagination
 */
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      paymentStatus: req.query.paymentStatus as string,
      bookingType: req.query.bookingType as string,
      userId: req.query.userId as string,
      vehicleId: req.query.vehicleId as string,
      chauffeurId: req.query.chauffeurId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: (req.query.sortOrder as string) || 'DESC',
    };

    const result = await bookingService.getAllBookings(filters);

    res.status(200).json({
      success: true,
      data: result.bookings,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch bookings',
        code: 'BOOKING_FETCH_ERROR',
      },
    });
  }
};

/**
 * GET /api/bookings/:id
 * Get single booking details
 */
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const booking = await bookingService.getBookingById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch booking',
        code: 'BOOKING_FETCH_ERROR',
      },
    });
  }
};

/**
 * PUT /api/bookings/:id/status
 * Update booking status (admin override)
 */
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { bookingStatus } = req.body;

    if (!bookingStatus) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'bookingStatus is required',
          code: 'MISSING_STATUS',
        },
      });
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'PICKED_UP', 'DROPPED_OFF', 'CANCELLED', 'COMPLETED'];
    if (!validStatuses.includes(bookingStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS',
        },
      });
    }

    const booking = await bookingService.updateBookingStatus(id, bookingStatus);

    res.status(200).json({
      success: true,
      data: booking,
      message: `Booking status updated to ${bookingStatus}`,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to update booking status',
        code: 'STATUS_UPDATE_ERROR',
      },
    });
  }
};

/**
 * PUT /api/bookings/:id/cancel
 * Cancel a booking
 */
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await bookingService.cancelBooking(id, reason);

    res.status(200).json({
      success: true,
      data: booking,
      message: 'Booking cancelled successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to cancel booking',
        code: 'CANCELLATION_ERROR',
      },
    });
  }
};

/**
 * GET /api/bookings/expired
 * Get all expired PENDING bookings
 */
export const getExpiredBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await bookingService.getExpiredBookings();

    res.status(200).json({
      success: true,
      data: bookings,
      count: bookings.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch expired bookings',
        code: 'EXPIRED_FETCH_ERROR',
      },
    });
  }
};

/**
 * DELETE /api/bookings/:id/cleanup
 * Cleanup an expired booking (soft delete)
 */
export const cleanupExpiredBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await bookingService.cleanupExpiredBooking(id);

    res.status(200).json({
      success: true,
      message: 'Expired booking cleaned up successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to cleanup booking',
        code: 'CLEANUP_ERROR',
      },
    });
  }
};

/**
 * GET /api/bookings/export
 * Export bookings to CSV with filters
 */
export const exportBookings = async (req: Request, res: Response) => {
  try {
    const { CSVExportService } = await import('../../services/csv/csvExport.service');
    
    const filters = {
      status: req.query.status as string,
      paymentStatus: req.query.paymentStatus as string,
      bookingType: req.query.bookingType as string,
      userId: req.query.userId as string,
      vehicleId: req.query.vehicleId as string,
      chauffeurId: req.query.chauffeurId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      search: req.query.search as string,
    };

    const bookings = await bookingService.exportBookingsToCSV(filters);

    const columns = [
      { key: 'id', label: 'Booking ID' },
      { key: 'User.firstName', label: 'Client First Name' },
      { key: 'User.lastName', label: 'Client Last Name' },
      { key: 'User.email', label: 'Client Email' },
      { key: 'User.phone', label: 'Client Phone' },
      { key: 'Vehicle.make', label: 'Vehicle Make' },
      { key: 'Vehicle.model', label: 'Vehicle Model' },
      { key: 'Vehicle.year', label: 'Vehicle Year' },
      { key: 'bookingType', label: 'Booking Type' },
      { key: 'bookingStatus', label: 'Status' },
      { key: 'paymentStatus', label: 'Payment Status' },
      { 
        key: 'startDatetime', 
        label: 'Start Date',
        format: CSVExportService.formatDateTime
      },
      { 
        key: 'endDatetime', 
        label: 'End Date',
        format: CSVExportService.formatDateTime
      },
      { key: 'Chauffeur.fullName', label: 'Chauffeur Name' },
      { key: 'Chauffeur.phone', label: 'Chauffeur Phone' },
      { 
        key: 'BookingFinancial.totalAmount', 
        label: 'Total Amount',
        format: (val: number) => CSVExportService.formatCurrency(val)
      },
      { 
        key: 'createdAt', 
        label: 'Created At',
        format: CSVExportService.formatDateTime
      },
    ];

    const csv = CSVExportService.generateCSV(bookings, columns);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=bookings-${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to export bookings',
        code: 'EXPORT_ERROR',
      },
    });
  }
};
