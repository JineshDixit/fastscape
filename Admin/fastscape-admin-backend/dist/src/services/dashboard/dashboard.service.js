"use strict";
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
exports.getDashboardStats = exports.getBookingsOverview = exports.getEarningSummary = exports.getRentStatus = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
/**
 * Get rent status statistics (booking status breakdown)
 */
const getRentStatus = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (period = 'week') {
    const now = new Date();
    let startDate;
    switch (period) {
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    const statusCounts = yield models_1.Booking.findAll({
        attributes: ['bookingStatus', [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'count']],
        where: {
            created_at: {
                [sequelize_1.Op.gte]: startDate,
            },
        },
        group: ['booking_status'],
        raw: true,
    });
    const result = {
        COMPLETED: 0,
        PENDING: 0,
        CANCELLED: 0,
    };
    statusCounts.forEach((item) => {
        const status = item.booking_status || item.bookingStatus;
        if (status === 'COMPLETED') {
            result.COMPLETED = parseInt(item.count);
        }
        else if (status === 'PENDING' || status === 'CONFIRMED' || status === 'PICKED_UP' || status === 'DROPPED_OFF') {
            result.PENDING += parseInt(item.count);
        }
        else if (status === 'CANCELLED') {
            result.CANCELLED = parseInt(item.count);
        }
    });
    const total = result.COMPLETED + result.PENDING + result.CANCELLED;
    return {
        complete: result.COMPLETED,
        pending: result.PENDING,
        cancelled: result.CANCELLED,
        total,
    };
});
exports.getRentStatus = getRentStatus;
/**
 * Get earning summary over time
 */
const getEarningSummary = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (months = 8) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    // Use raw SQL to avoid complex join issues
    const query = `
    SELECT 
      DATE_TRUNC('month', bf.created_at) as month,
      COALESCE(SUM(CAST(bf.total_amount AS DECIMAL)), 0) as total
    FROM booking_financials bf
    INNER JOIN bookings b ON bf.booking_id = b.id
    WHERE b.booking_status IN ('COMPLETED', 'CONFIRMED', 'PICKED_UP', 'DROPPED_OFF')
    AND bf.created_at >= :startDate
    GROUP BY DATE_TRUNC('month', bf.created_at)
    ORDER BY DATE_TRUNC('month', bf.created_at) ASC
  `;
    const earnings = yield models_1.sequelize.query(query, {
        replacements: { startDate },
        type: 'SELECT',
    });
    // Fill in missing months with 0
    const result = [];
    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
        const existing = earnings.find((e) => {
            const earnMonth = new Date(e.month).toISOString().substring(0, 7);
            return earnMonth === monthKey;
        });
        result.push({
            month: date.toLocaleString('en-US', { month: 'short' }),
            year: date.getFullYear(),
            amount: existing ? parseFloat(existing.total) : 0,
        });
    }
    return result;
});
exports.getEarningSummary = getEarningSummary;
/**
 * Get bookings overview by month for the year
 */
const getBookingsOverview = (year) => __awaiter(void 0, void 0, void 0, function* () {
    const targetYear = year || new Date().getFullYear();
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59);
    const bookings = yield models_1.Booking.findAll({
        attributes: [
            [(0, sequelize_1.fn)('EXTRACT', (0, sequelize_1.literal)('MONTH FROM created_at')), 'month_num'],
            [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'count'],
        ],
        where: {
            created_at: {
                [sequelize_1.Op.between]: [startDate, endDate],
            },
        },
        group: [(0, sequelize_1.fn)('EXTRACT', (0, sequelize_1.literal)('MONTH FROM created_at'))],
        order: [[(0, sequelize_1.fn)('EXTRACT', (0, sequelize_1.literal)('MONTH FROM created_at')), 'ASC']],
        raw: true,
    });
    // Fill in all 12 months
    const result = [];
    for (let i = 0; i < 12; i++) {
        const monthNum = i + 1; // 1-12
        const date = new Date(targetYear, i, 1);
        const existing = bookings.find((b) => parseInt(b.month_num) === monthNum);
        result.push({
            month: date.toLocaleString('en-US', { month: 'short' }),
            count: existing ? parseInt(existing.count) : 0,
        });
    }
    return result;
});
exports.getBookingsOverview = getBookingsOverview;
/**
 * Get dashboard summary statistics
 */
const getDashboardStats = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    // Total bookings this month
    const totalBookingsThisMonth = yield models_1.Booking.count({
        where: {
            created_at: {
                [sequelize_1.Op.gte]: thisMonthStart,
            },
        },
    });
    // Total bookings last month
    const totalBookingsLastMonth = yield models_1.Booking.count({
        where: {
            created_at: {
                [sequelize_1.Op.between]: [lastMonth, thisMonthStart],
            },
        },
    });
    // Active vehicles (not in maintenance or inactive)
    const activeVehicles = yield models_1.Vehicle.count();
    // Total active vehicles last month (approximation - just use total count)
    const activeVehiclesLastMonth = activeVehicles;
    // Total clients (users)
    const totalClients = yield models_1.User.count();
    // Clients from last month
    const clientsLastMonth = yield models_1.User.count({
        where: {
            created_at: {
                [sequelize_1.Op.lt]: thisMonthStart,
            },
        },
    });
    // Revenue this month - using raw SQL to avoid join issues
    const revenueThisMonthQuery = `
    SELECT COALESCE(SUM(CAST(bf.total_amount AS DECIMAL)), 0) as total
    FROM booking_financials bf
    INNER JOIN bookings b ON bf.booking_id = b.id
    WHERE b.booking_status = 'COMPLETED'
    AND b.created_at >= :thisMonthStart
  `;
    const revenueThisMonthResult = yield models_1.sequelize.query(revenueThisMonthQuery, {
        replacements: { thisMonthStart },
        type: 'SELECT',
    });
    const revenueThisMonth = parseFloat(((_a = revenueThisMonthResult[0]) === null || _a === void 0 ? void 0 : _a.total) || '0');
    // Revenue last month
    const revenueLastMonthQuery = `
    SELECT COALESCE(SUM(CAST(bf.total_amount AS DECIMAL)), 0) as total
    FROM booking_financials bf
    INNER JOIN bookings b ON bf.booking_id = b.id
    WHERE b.booking_status = 'COMPLETED'
    AND b.created_at >= :lastMonth
    AND b.created_at < :thisMonthStart
  `;
    const revenueLastMonthResult = yield models_1.sequelize.query(revenueLastMonthQuery, {
        replacements: { lastMonth, thisMonthStart },
        type: 'SELECT',
    });
    const revenueLastMonth = parseFloat(((_b = revenueLastMonthResult[0]) === null || _b === void 0 ? void 0 : _b.total) || '0');
    const calculatePercentage = (current, previous) => {
        if (previous === 0)
            return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    };
    return {
        totalBookings: {
            value: totalBookingsThisMonth,
            change: calculatePercentage(totalBookingsThisMonth, totalBookingsLastMonth),
        },
        activeVehicles: {
            value: activeVehicles,
            change: calculatePercentage(activeVehicles, activeVehiclesLastMonth),
        },
        totalClients: {
            value: totalClients,
            change: calculatePercentage(totalClients, clientsLastMonth),
        },
        revenue: {
            value: revenueThisMonth,
            change: calculatePercentage(revenueThisMonth, revenueLastMonth),
        },
    };
});
exports.getDashboardStats = getDashboardStats;
//# sourceMappingURL=dashboard.service.js.map