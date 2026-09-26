import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard/dashboard.controller';
import { authenticateUser } from '../services/middleware/authenticateUser';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

/**
 * GET /api/dashboard/stats
 * Get dashboard summary statistics
 */
router.get('/stats', dashboardController.getDashboardStats);

/**
 * GET /api/dashboard/rent-status
 * Get rent status breakdown
 * Query params: period (week, month, year)
 */
router.get('/rent-status', dashboardController.getRentStatus);

/**
 * GET /api/dashboard/earning-summary
 * Get earning summary over time
 * Query params: months (default: 8)
 */
router.get('/earning-summary', dashboardController.getEarningSummary);

/**
 * GET /api/dashboard/bookings-overview
 * Get bookings overview by month
 * Query params: year (default: current year)
 */
router.get('/bookings-overview', dashboardController.getBookingsOverview);

export default router;
