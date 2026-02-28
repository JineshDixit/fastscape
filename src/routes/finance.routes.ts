import { Router } from 'express';
import * as financeController from '../controllers/finance/finance.controller';
import { authenticateUser } from '../services/middleware/authenticateUser';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

/**
 * GET /api/finance/export
 * Export financials to CSV with filters
 * Query params: paymentStatus, startDate, endDate, search
 * Must be before /:id route to avoid route conflict
 */
router.get('/export', financeController.exportFinancials);

/**
 * GET /api/finance/stats
 * Get financial statistics (completed, awaiting, overdue)
 * Must be before /:id route to avoid route conflict
 */
router.get('/stats', financeController.getFinancialStats);

/**
 * GET /api/finance/invoice/:id
 * Generate and download invoice PDF for a single booking
 */
router.get('/invoice/:id', financeController.downloadInvoice);

/**
 * POST /api/finance/invoices/bulk
 * Generate and download multiple invoices as a single PDF
 * Body: { bookingIds: string[] }
 */
router.post('/invoices/bulk', financeController.downloadBulkInvoices);

/**
 * GET /api/finance
 * Get all booking financials with filters and pagination
 * Query params: paymentStatus, bookingStatus, startDate, endDate, page, limit, search, sortBy, sortOrder
 */
router.get('/', financeController.getAllFinancials);

/**
 * GET /api/finance/:id
 * Get single financial record by booking ID
 */
router.get('/:id', financeController.getFinancialById);

export default router;
