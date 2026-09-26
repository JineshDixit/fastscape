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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const financeController = __importStar(require("../controllers/finance/finance.controller"));
const authenticateUser_1 = require("../services/middleware/authenticateUser");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(authenticateUser_1.authenticateUser);
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
exports.default = router;
//# sourceMappingURL=finance.routes.js.map