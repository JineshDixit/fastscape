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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportFinancialsToCSV = exports.getFinancialStats = exports.getFinancialById = exports.getAllFinancials = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
const logger_1 = __importDefault(require("../../config/logger"));
/**
 * Get all booking financials with filtering and pagination
 */
const getAllFinancials = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const startTime = Date.now();
    logger_1.default.debug('Fetching financials with filters', { filters });
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const offset = (page - 1) * limit;
    const where = {};
    const bookingWhere = {};
    if (filters.paymentStatus) {
        bookingWhere.paymentStatus = filters.paymentStatus;
    }
    if (filters.bookingStatus) {
        bookingWhere.bookingStatus = filters.bookingStatus;
    }
    if (filters.startDate) {
        bookingWhere.startDatetime = {
            [sequelize_1.Op.gte]: new Date(filters.startDate),
        };
    }
    if (filters.endDate) {
        bookingWhere.endDatetime = {
            [sequelize_1.Op.lte]: new Date(filters.endDate),
        };
    }
    // Server-side search logic
    if (filters.search) {
        const searchCondition = {
            [sequelize_1.Op.or]: [
                { '$Booking.id$': { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { '$Booking.User.firstName$': { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { '$Booking.User.lastName$': { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { '$Booking.Vehicle.make$': { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { '$Booking.Vehicle.model$': { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            ],
        };
        Object.assign(where, searchCondition);
    }
    // Sorting logic
    let order = [['createdAt', 'DESC']];
    if (filters.sortBy) {
        const sortOrder = ((_a = filters.sortOrder) === null || _a === void 0 ? void 0 : _a.toUpperCase()) === 'ASC' ? 'ASC' : 'DESC';
        const field = filters.sortBy;
        if (field === 'clientName') {
            order = [[{ model: models_1.Booking, as: 'Booking' }, { model: models_1.User, as: 'User' }, 'firstName', sortOrder]];
        }
        else if (field === 'carModel') {
            order = [[{ model: models_1.Booking, as: 'Booking' }, { model: models_1.Vehicle, as: 'Vehicle' }, 'model', sortOrder]];
        }
        else if (field === 'totalAmount' || field === 'paidAmount' || field === 'remainingAmount') {
            order = [[field, sortOrder]];
        }
        else if (field === 'dueDate') {
            order = [[{ model: models_1.Booking, as: 'Booking' }, 'endDatetime', sortOrder]];
        }
        else {
            order = [['createdAt', sortOrder]];
        }
    }
    const { rows: financials, count: total } = yield models_1.BookingFinancial.findAndCountAll({
        where,
        include: [
            {
                model: models_1.Booking,
                where: bookingWhere,
                required: true,
                include: [
                    {
                        model: models_1.User,
                        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
                    },
                    {
                        model: models_1.Vehicle,
                        attributes: ['id', 'make', 'model', 'year', 'bodyType'],
                    },
                ],
            },
        ],
        order,
        limit,
        offset,
    });
    const duration = Date.now() - startTime;
    logger_1.default.info('Financials fetched successfully', {
        count: financials.length,
        total,
        page,
        duration: `${duration}ms`,
    });
    return {
        financials,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
});
exports.getAllFinancials = getAllFinancials;
/**
 * Get single financial record with full details
 */
const getFinancialById = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.debug('Fetching financial by booking ID', { bookingId });
    const financial = yield models_1.BookingFinancial.findOne({
        where: { bookingId },
        include: [
            {
                model: models_1.Booking,
                include: [
                    {
                        model: models_1.User,
                        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
                    },
                    {
                        model: models_1.Vehicle,
                        attributes: ['id', 'make', 'model', 'year', 'bodyType'],
                    },
                ],
            },
        ],
    });
    if (!financial) {
        logger_1.default.warn('Financial record not found', { bookingId });
        return null;
    }
    // Get all payments for this booking
    const payments = yield models_1.Payment.findAll({
        where: { bookingId },
        order: [['createdAt', 'DESC']],
    });
    logger_1.default.debug('Financial record found', {
        bookingId,
        totalAmount: financial.totalAmount,
        paidAmount: financial.paidAmount,
        paymentsCount: payments.length,
    });
    return Object.assign(Object.assign({}, financial.toJSON()), { Payments: payments });
});
exports.getFinancialById = getFinancialById;
/**
 * Get financial statistics
 */
const getFinancialStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = Date.now();
    logger_1.default.debug('Calculating financial statistics');
    // Get completed payments (PAID status)
    const completedResult = yield models_1.BookingFinancial.findAll({
        attributes: [[models_1.sequelize.fn('COUNT', models_1.sequelize.col('BookingFinancial.id')), 'count']],
        include: [
            {
                model: models_1.Booking,
                attributes: [],
                where: { paymentStatus: 'PAID' },
                required: true,
            },
        ],
        raw: true,
    });
    const completedCount = parseInt(completedResult[0].count || '0');
    const completedAmountResult = yield models_1.BookingFinancial.findAll({
        attributes: [[models_1.sequelize.fn('SUM', models_1.sequelize.col('BookingFinancial.total_amount')), 'total']],
        include: [
            {
                model: models_1.Booking,
                attributes: [],
                where: { paymentStatus: 'PAID' },
                required: true,
            },
        ],
        raw: true,
    });
    const completedAmount = parseFloat(completedAmountResult[0].total || '0');
    // Get awaiting payments (UNPAID, PARTIALLY_PAID)
    const awaitingResult = yield models_1.BookingFinancial.findAll({
        attributes: [[models_1.sequelize.fn('COUNT', models_1.sequelize.col('BookingFinancial.id')), 'count']],
        include: [
            {
                model: models_1.Booking,
                attributes: [],
                where: {
                    paymentStatus: {
                        [sequelize_1.Op.in]: ['UNPAID', 'PARTIALLY_PAID'],
                    },
                },
                required: true,
            },
        ],
        raw: true,
    });
    const awaitingCount = parseInt(awaitingResult[0].count || '0');
    const awaitingAmountResult = yield models_1.BookingFinancial.findAll({
        attributes: [[models_1.sequelize.fn('SUM', models_1.sequelize.col('BookingFinancial.remaining_amount')), 'total']],
        include: [
            {
                model: models_1.Booking,
                attributes: [],
                where: {
                    paymentStatus: {
                        [sequelize_1.Op.in]: ['UNPAID', 'PARTIALLY_PAID'],
                    },
                },
                required: true,
            },
        ],
        raw: true,
    });
    const awaitingAmount = parseFloat(awaitingAmountResult[0].total || '0');
    // Get overdue payments (OVERDUE status)
    const overdueResult = yield models_1.BookingFinancial.findAll({
        attributes: [[models_1.sequelize.fn('COUNT', models_1.sequelize.col('BookingFinancial.id')), 'count']],
        include: [
            {
                model: models_1.Booking,
                attributes: [],
                where: { paymentStatus: 'OVERDUE' },
                required: true,
            },
        ],
        raw: true,
    });
    const overdueCount = parseInt(overdueResult[0].count || '0');
    const overdueAmountResult = yield models_1.BookingFinancial.findAll({
        attributes: [[models_1.sequelize.fn('SUM', models_1.sequelize.col('BookingFinancial.remaining_amount')), 'total']],
        include: [
            {
                model: models_1.Booking,
                attributes: [],
                where: { paymentStatus: 'OVERDUE' },
                required: true,
            },
        ],
        raw: true,
    });
    const overdueAmount = parseFloat(overdueAmountResult[0].total || '0');
    const duration = Date.now() - startTime;
    logger_1.default.info('Financial statistics calculated', {
        completedCount,
        awaitingCount,
        overdueCount,
        duration: `${duration}ms`,
    });
    return {
        completed: {
            count: completedCount,
            amount: completedAmount,
        },
        awaiting: {
            count: awaitingCount,
            amount: awaitingAmount,
        },
        overdue: {
            count: overdueCount,
            amount: overdueAmount,
        },
    };
});
exports.getFinancialStats = getFinancialStats;
/**
 * Export financials to CSV with filters
 */
const exportFinancialsToCSV = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    const where = {};
    const bookingWhere = {};
    if (filters.paymentStatus) {
        bookingWhere.paymentStatus = filters.paymentStatus;
    }
    if (filters.startDate) {
        bookingWhere.startDatetime = {
            [sequelize_1.Op.gte]: new Date(filters.startDate),
        };
    }
    if (filters.endDate) {
        bookingWhere.endDatetime = {
            [sequelize_1.Op.lte]: new Date(filters.endDate),
        };
    }
    if (filters.search) {
        const searchCondition = {
            [sequelize_1.Op.or]: [
                { bookingId: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { '$Booking.User.firstName$': { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { '$Booking.User.lastName$': { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { '$Booking.Vehicle.make$': { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { '$Booking.Vehicle.model$': { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            ],
        };
        Object.assign(where, searchCondition);
    }
    const financials = yield models_1.BookingFinancial.findAll({
        where,
        include: [
            {
                model: models_1.Booking,
                where: bookingWhere,
                include: [
                    {
                        model: models_1.User,
                        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
                    },
                    {
                        model: models_1.Vehicle,
                        attributes: ['id', 'make', 'model', 'year'],
                    },
                ],
            },
        ],
        order: [['createdAt', 'DESC']],
        limit: 5000,
    });
    return financials;
});
exports.exportFinancialsToCSV = exportFinancialsToCSV;
//# sourceMappingURL=finance.service.js.map