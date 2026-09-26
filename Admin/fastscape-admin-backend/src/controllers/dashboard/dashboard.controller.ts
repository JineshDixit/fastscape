import { Request, Response } from 'express';
import * as dashboardService from '../../services/dashboard/dashboard.service';

/**
 * GET /api/dashboard/stats
 * Get dashboard summary statistics
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getDashboardStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch dashboard stats',
        code: 'DASHBOARD_STATS_ERROR',
      },
    });
  }
};

/**
 * GET /api/dashboard/rent-status
 * Get rent status breakdown (complete, pending, cancelled)
 */
export const getRentStatus = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'week';
    const data = await dashboardService.getRentStatus(period);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch rent status',
        code: 'RENT_STATUS_ERROR',
      },
    });
  }
};

/**
 * GET /api/dashboard/earning-summary
 * Get earning summary over time
 */
export const getEarningSummary = async (req: Request, res: Response) => {
  try {
    const months = req.query.months ? parseInt(req.query.months as string) : 8;
    const data = await dashboardService.getEarningSummary(months);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch earning summary',
        code: 'EARNING_SUMMARY_ERROR',
      },
    });
  }
};

/**
 * GET /api/dashboard/bookings-overview
 * Get bookings overview by month
 */
export const getBookingsOverview = async (req: Request, res: Response) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const data = await dashboardService.getBookingsOverview(year);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch bookings overview',
        code: 'BOOKINGS_OVERVIEW_ERROR',
      },
    });
  }
};
