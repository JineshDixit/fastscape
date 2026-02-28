"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportFinancials = exports.downloadBulkInvoices = exports.downloadInvoice = exports.getFinancialStats = exports.getFinancialById = exports.getAllFinancials = void 0;
const financeService = __importStar(require("../../services/finance/finance.service"));
const pdfGeneratorService = __importStar(require("../../services/finance/pdfGenerator.service"));
const logger_1 = __importDefault(require("../../config/logger"));
/**
 * GET /api/finance
 * Get all booking financials with filters and pagination
 */
const getAllFinancials = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger_1.default.debug('Fetching financials with filters', { query: req.query });
        const filters = {
            paymentStatus: req.query.paymentStatus,
            bookingStatus: req.query.bookingStatus,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            search: req.query.search,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder || 'DESC',
        };
        const result = yield financeService.getAllFinancials(filters);
        logger_1.default.info(`Retrieved ${result.financials.length} financials`, {
            total: result.pagination.total,
            page: result.pagination.page,
        });
        res.status(200).json({
            success: true,
            data: result.financials,
            pagination: result.pagination,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to fetch financials', { error: error.message, stack: error.stack });
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch financials',
                code: 'FINANCE_FETCH_ERROR',
            },
        });
    }
});
exports.getAllFinancials = getAllFinancials;
/**
 * GET /api/finance/:id
 * Get single financial record by booking ID
 */
const getFinancialById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const financial = yield financeService.getFinancialById(id);
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
    }
    catch (error) {
        logger_1.default.error('Failed to fetch financial', { error: error.message, stack: error.stack });
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch financial',
                code: 'FINANCE_FETCH_ERROR',
            },
        });
    }
});
exports.getFinancialById = getFinancialById;
/**
 * GET /api/finance/stats
 * Get financial statistics (completed, awaiting, overdue)
 */
const getFinancialStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger_1.default.debug('Fetching financial statistics');
        const stats = yield financeService.getFinancialStats();
        logger_1.default.info('Financial statistics retrieved', { stats });
        res.status(200).json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to fetch financial stats', { error: error.message, stack: error.stack });
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch financial statistics',
                code: 'STATS_FETCH_ERROR',
            },
        });
    }
});
exports.getFinancialStats = getFinancialStats;
/**
 * GET /api/finance/invoice/:id
 * Generate and download invoice PDF for a single booking
 */
const downloadInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        logger_1.default.info('Generating invoice PDF', { bookingId: id });
        const pdfBuffer = yield pdfGeneratorService.generateInvoicePDF(id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${id.slice(0, 8)}.pdf`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
    }
    catch (error) {
        logger_1.default.error('Failed to generate invoice PDF', { error: error.message, stack: error.stack });
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to generate invoice PDF',
                code: 'INVOICE_GENERATION_ERROR',
            },
        });
    }
});
exports.downloadInvoice = downloadInvoice;
/**
 * POST /api/finance/invoices/bulk
 * Generate and download multiple invoices as a single PDF
 * Body: { bookingIds: string[] }
 */
const downloadBulkInvoices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        logger_1.default.info('Generating bulk invoices PDF', { count: bookingIds.length });
        const pdfBuffer = yield pdfGeneratorService.generateMultipleInvoicesPDF(bookingIds);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoices-${Date.now()}.pdf`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
    }
    catch (error) {
        logger_1.default.error('Failed to generate bulk invoices PDF', { error: error.message, stack: error.stack });
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to generate bulk invoices PDF',
                code: 'BULK_INVOICE_GENERATION_ERROR',
            },
        });
    }
});
exports.downloadBulkInvoices = downloadBulkInvoices;
/**
 * GET /api/financials/export
 * Export financials to CSV with filters
 */
const exportFinancials = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { CSVExportService } = yield Promise.resolve().then(() => __importStar(require('../../services/csv/csvExport.service')));
        const filters = {
            paymentStatus: req.query.paymentStatus,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            search: req.query.search,
        };
        const financials = yield financeService.exportFinancialsToCSV(filters);
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
                format: (val) => CSVExportService.formatCurrency(val),
            },
            {
                key: 'vehicleRentalCost',
                label: 'Vehicle Rental Cost',
                format: (val) => CSVExportService.formatCurrency(val),
            },
            {
                key: 'chauffeurCost',
                label: 'Chauffeur Cost',
                format: (val) => CSVExportService.formatCurrency(val),
            },
            {
                key: 'depositAmount',
                label: 'Deposit Amount',
                format: (val) => CSVExportService.formatCurrency(val),
            },
            {
                key: 'delayCharges',
                label: 'Delay Charges',
                format: (val) => CSVExportService.formatCurrency(val),
            },
            {
                key: 'Booking.startDatetime',
                label: 'Start Date',
                format: CSVExportService.formatDateTime,
            },
            {
                key: 'Booking.endDatetime',
                label: 'End Date',
                format: CSVExportService.formatDateTime,
            },
            {
                key: 'createdAt',
                label: 'Created At',
                format: CSVExportService.formatDateTime,
            },
        ];
        const csv = CSVExportService.generateCSV(financials, columns);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=financials-${Date.now()}.csv`);
        res.status(200).send(csv);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to export financials',
                code: 'EXPORT_ERROR',
            },
        });
    }
});
exports.exportFinancials = exportFinancials;
//# sourceMappingURL=finance.controller.js.map