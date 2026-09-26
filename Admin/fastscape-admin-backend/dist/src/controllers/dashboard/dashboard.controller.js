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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingsOverview = exports.getEarningSummary = exports.getRentStatus = exports.getDashboardStats = void 0;
const dashboardService = __importStar(require("../../services/dashboard/dashboard.service"));
/**
 * GET /api/dashboard/stats
 * Get dashboard summary statistics
 */
const getDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield dashboardService.getDashboardStats();
        res.status(200).json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch dashboard stats',
                code: 'DASHBOARD_STATS_ERROR',
            },
        });
    }
});
exports.getDashboardStats = getDashboardStats;
/**
 * GET /api/dashboard/rent-status
 * Get rent status breakdown (complete, pending, cancelled)
 */
const getRentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const period = req.query.period || 'week';
        const data = yield dashboardService.getRentStatus(period);
        res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch rent status',
                code: 'RENT_STATUS_ERROR',
            },
        });
    }
});
exports.getRentStatus = getRentStatus;
/**
 * GET /api/dashboard/earning-summary
 * Get earning summary over time
 */
const getEarningSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const months = req.query.months ? parseInt(req.query.months) : 8;
        const data = yield dashboardService.getEarningSummary(months);
        res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch earning summary',
                code: 'EARNING_SUMMARY_ERROR',
            },
        });
    }
});
exports.getEarningSummary = getEarningSummary;
/**
 * GET /api/dashboard/bookings-overview
 * Get bookings overview by month
 */
const getBookingsOverview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const year = req.query.year ? parseInt(req.query.year) : undefined;
        const data = yield dashboardService.getBookingsOverview(year);
        res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch bookings overview',
                code: 'BOOKINGS_OVERVIEW_ERROR',
            },
        });
    }
});
exports.getBookingsOverview = getBookingsOverview;
//# sourceMappingURL=dashboard.controller.js.map