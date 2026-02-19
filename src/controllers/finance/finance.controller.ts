import { Request, Response } from 'express';
import * as financeService from '../../services/finance/finance.service';
import * as pdfGeneratorService from '../../services/finance/pdfGenerator.service';
import logger from '../../config/logger';

/**
 * GET /api/finance
 * Get all booking financials with filters and pagination
 */
export const getAllFinancials = async (req: Request, res: Response) => {
  try {
    logger.debug('Fetching financials with filters', { query: req.query });

    const filters = {
      paymentStatus: req.query.paymentStatus as string,
      bookingStatus: req.query.bookingStatus as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: (req.query.sortOrder as string) || 'DESC',
    };

    const result = await financeService.getAllFinancials(filters);

    logger.info(`Retrieved ${result.financials.length} financials`, {
      total: result.pagination.total,
      page: result.pagination.page,
    });

    res.status(200).json({
      success: true,
      data: result.financials,
      pagination: result.pagination,
    });
  } catch (error: any) {
    logger.error('Failed to fetch financials', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch financials',
        code: 'FINANCE_FETCH_ERROR',
      },
    });
  }
};

/**
 * GET /api/finance/:id
 * Get single financial record by booking ID
 */
export const getFinancialById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const financial = await financeService.getFinancialById(id);

    if (!financial) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Financial record not found',
          code: 'FINANCE_NOT_FOUND',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: financial,
    });
  } catch (error: any) {
    logger.error('Failed to fetch financial', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch financial',
        code: 'FINANCE_FETCH_ERROR',
      },
    });
  }
};

/**
 * GET /api/finance/stats
 * Get financial statistics (completed, awaiting, overdue)
 */
export const getFinancialStats = async (req: Request, res: Response) => {
  try {
    logger.debug('Fetching financial statistics');

    const stats = await financeService.getFinancialStats();

    logger.info('Financial statistics retrieved', { stats });

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('Failed to fetch financial stats', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch financial statistics',
        code: 'STATS_FETCH_ERROR',
      },
    });
  }
};


/**
 * GET /api/finance/invoice/:id
 * Generate and download invoice PDF for a single booking
 */
export const downloadInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info('Generating invoice PDF', { bookingId: id });

    const pdfBuffer = await pdfGeneratorService.generateInvoicePDF(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${id.slice(0, 8)}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error: any) {
    logger.error('Failed to generate invoice PDF', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to generate invoice PDF',
        code: 'INVOICE_GENERATION_ERROR',
      },
    });
  }
};

/**
 * POST /api/finance/invoices/bulk
 * Generate and download multiple invoices as a single PDF
 * Body: { bookingIds: string[] }
 */
export const downloadBulkInvoices = async (req: Request, res: Response) => {
  try {
    const { bookingIds } = req.body;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'bookingIds array is required and must not be empty',
          code: 'INVALID_REQUEST',
        },
      });
    }

    logger.info('Generating bulk invoices PDF', { count: bookingIds.length });

    const pdfBuffer = await pdfGeneratorService.generateMultipleInvoicesPDF(bookingIds);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoices-${Date.now()}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error: any) {
    logger.error('Failed to generate bulk invoices PDF', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to generate bulk invoices PDF',
        code: 'BULK_INVOICE_GENERATION_ERROR',
      },
    });
  }
};

/**
 * GET /api/financials/export
 * Export financials to CSV with filters
 */
export const exportFinancials = async (req: Request, res: Response) => {
  try {
    const { CSVExportService } = await import('../../services/csv/csvExport.service');
    
    const filters = {
      paymentStatus: req.query.paymentStatus as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      search: req.query.search as string,
    };

    const financials = await financeService.exportFinancialsToCSV(filters);

    const columns = [
      { key: 'id', label: 'Financial ID' },
      { key: 'bookingId', label: 'Booking ID' },
      { key: 'User.firstName', label: 'Client First Name' },
      { key: 'User.lastName', label: 'Client Last Name' },
      { key: 'User.email', label: 'Client Email' },
      { key: 'Vehicle.make', label: 'Vehicle Make' },
      { key: 'Vehicle.model', label: 'Vehicle Model' },
      { key: 'Booking.paymentStatus', label: 'Payment Status' },
      { 
        key: 'totalAmount', 
        label: 'Total Amount',
        format: (val: number) => CSVExportService.formatCurrency(val)
      },
      { 
        key: 'vehicleRentalCost', 
        label: 'Vehicle Rental Cost',
        format: (val: number) => CSVExportService.formatCurrency(val)
      },
      { 
        key: 'chauffeurCost', 
        label: 'Chauffeur Cost',
        format: (val: number) => CSVExportService.formatCurrency(val)
      },
      { 
        key: 'depositAmount', 
        label: 'Deposit Amount',
        format: (val: number) => CSVExportService.formatCurrency(val)
      },
      { 
        key: 'delayCharges', 
        label: 'Delay Charges',
        format: (val: number) => CSVExportService.formatCurrency(val)
      },
      { 
        key: 'Booking.startDatetime', 
        label: 'Start Date',
        format: CSVExportService.formatDateTime
      },
      { 
        key: 'Booking.endDatetime', 
        label: 'End Date',
        format: CSVExportService.formatDateTime
      },
      { 
        key: 'createdAt', 
        label: 'Created At',
        format: CSVExportService.formatDateTime
      },
    ];

    const csv = CSVExportService.generateCSV(financials, columns);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=financials-${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to export financials',
        code: 'EXPORT_ERROR',
      },
    });
  }
};
