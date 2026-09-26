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
exports.initiatePaymentIntent = exports.getOverduePayments = exports.markPaymentCompleted = exports.getPaymentSummary = exports.applyDelayCharges = exports.calculateDelayCharges = exports.processBalancePayment = exports.processDepositPayment = exports.calculatePaymentBreakdown = void 0;
const models_1 = require("../../models");
const errorHandler_1 = require("../middleware/errorHandler");
const stripe_service_1 = require("./stripe.service");
const sequelize_1 = require("sequelize");
const logger_1 = __importDefault(require("../../utils/logger"));
const PLATFORM_CHARGE_RATE = 5.0; // 5% platform fee
const GATEWAY_FEE_PERCENT = 2.9; // Stripe example
const GATEWAY_FEE_FIXED = 0.3; // Stripe example 30 cents
/**
 * Calculate payment breakdown for a booking
 */
const calculatePaymentBreakdown = (bookingId_1, ...args_1) => __awaiter(void 0, [bookingId_1, ...args_1], void 0, function* (bookingId, delayHours = 0) {
    const booking = yield models_1.Booking.findByPk(bookingId, {
        include: [
            {
                model: models_1.Vehicle,
                attributes: ['pricePerDay', 'delayChargePerHour', 'depositPercentage', 'currency'],
            },
            {
                model: models_1.BookingFinancial,
                attributes: ['baseAmount', 'depositPercentage', 'taxAmount'],
            },
        ],
    });
    if (!booking) {
        throw (0, errorHandler_1.createError)('Booking not found', 404);
    }
    const vehicle = booking.Vehicle;
    const existingFinancial = booking.BookingFinancial;
    // Calculate rental duration in days
    const startDate = new Date(booking.startDatetime);
    const endDate = new Date(booking.endDatetime);
    const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    // Base calculations
    const baseAmount = (existingFinancial === null || existingFinancial === void 0 ? void 0 : existingFinancial.baseAmount) || vehicle.pricePerDay * rentalDays;
    const depositPercentage = (existingFinancial === null || existingFinancial === void 0 ? void 0 : existingFinancial.depositPercentage) || vehicle.depositPercentage;
    const depositAmount = (baseAmount * depositPercentage) / 100;
    const balanceAmount = baseAmount - depositAmount;
    // Delay charge calculation
    const delayChargeRate = vehicle.delayChargePerHour;
    const delayChargeAmount = delayHours > 0 ? delayHours * delayChargeRate : 0;
    // Tax calculation (example: 10% tax)
    const taxRate = 0.1;
    // Platform charge calculation
    const platformChargeRate = (existingFinancial === null || existingFinancial === void 0 ? void 0 : existingFinancial.platformChargeRate) || PLATFORM_CHARGE_RATE;
    const platformChargeAmount = (existingFinancial === null || existingFinancial === void 0 ? void 0 : existingFinancial.platformChargeAmount) || (baseAmount * platformChargeRate) / 100;
    const subtotal = baseAmount + delayChargeAmount + platformChargeAmount;
    const taxAmount = (existingFinancial === null || existingFinancial === void 0 ? void 0 : existingFinancial.taxAmount) || subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;
    return {
        baseAmount,
        depositAmount,
        balanceAmount,
        delayChargeAmount,
        taxAmount,
        platformChargeAmount,
        platformChargeRate,
        totalAmount,
        currency: vehicle.currency,
    };
});
exports.calculatePaymentBreakdown = calculatePaymentBreakdown;
/**
 * Process deposit payment
 */
const processDepositPayment = (bookingId_1, ...args_1) => __awaiter(void 0, [bookingId_1, ...args_1], void 0, function* (bookingId, paymentMethod = 'ONLINE', stripePaymentIntentId, stripeData) {
    const transaction = yield models_1.sequelize.transaction();
    try {
        const calculation = yield (0, exports.calculatePaymentBreakdown)(bookingId);
        // Create or update booking financial record
        let financial = yield models_1.BookingFinancial.findOne({
            where: { bookingId },
            transaction,
            lock: true,
        });
        if (!financial) {
            financial = yield models_1.BookingFinancial.create({
                bookingId,
                baseAmount: calculation.baseAmount,
                depositAmount: calculation.depositAmount,
                balanceAmount: calculation.balanceAmount,
                delayChargeAmount: 0,
                delayChargeRate: 0,
                taxAmount: calculation.taxAmount,
                platformChargeAmount: calculation.platformChargeAmount,
                platformChargeRate: calculation.platformChargeRate,
                totalAmount: calculation.totalAmount,
                paidAmount: 0,
                remainingAmount: calculation.totalAmount,
                currency: calculation.currency,
                depositPercentage: (calculation.depositAmount / calculation.baseAmount) * 100,
            }, { transaction });
        }
        // Create deposit payment record
        const booking = yield models_1.Booking.findByPk(bookingId, { transaction, lock: true });
        if (!booking)
            throw (0, errorHandler_1.createError)('Booking not found', 404);
        // Idempotency check: prevent duplicate payment records for the same intent
        const effectiveIntentId = (stripeData === null || stripeData === void 0 ? void 0 : stripeData.paymentIntentId) || stripePaymentIntentId;
        if (effectiveIntentId) {
            const existingPayment = yield models_1.Payment.findOne({
                where: { stripePaymentIntentId: effectiveIntentId, paymentType: 'DEPOSIT' },
                transaction,
            });
            if (existingPayment) {
                yield transaction.rollback();
                return { payment: existingPayment, financial };
            }
        }
        // Calculate portion of platform charge for this payment
        const paymentPlatformCharge = (calculation.depositAmount / calculation.totalAmount) * calculation.platformChargeAmount;
        // Use Stripe data if provided, otherwise fallback to calculations
        const finalAmount = stripeData ? stripeData.amountReceived : calculation.depositAmount;
        const finalCurrency = stripeData ? stripeData.currency.toUpperCase() : calculation.currency;
        const gatewayFee = (stripeData === null || stripeData === void 0 ? void 0 : stripeData.gatewayFee) !== undefined
            ? stripeData.gatewayFee
            : paymentMethod === 'ONLINE'
                ? (finalAmount * GATEWAY_FEE_PERCENT) / 100 + GATEWAY_FEE_FIXED
                : 0;
        const payment = yield models_1.Payment.create({
            bookingId,
            userId: booking.userId,
            amount: finalAmount,
            currency: finalCurrency,
            paymentType: 'DEPOSIT',
            paymentStatus: paymentMethod === 'ONLINE' ? 'PAID' : 'UNPAID',
            paymentMethod,
            stripePaymentIntentId: effectiveIntentId,
            stripeChargeId: stripeData === null || stripeData === void 0 ? void 0 : stripeData.chargeId,
            gatewayFeeAmount: gatewayFee,
            platformChargeAmount: paymentPlatformCharge,
            paidAt: paymentMethod === 'ONLINE' ? new Date() : null,
            metadata: stripeData === null || stripeData === void 0 ? void 0 : stripeData.metadata,
        }, { transaction });
        // Update financial record if payment is completed
        if (paymentMethod === 'ONLINE') {
            yield financial.update({
                paidAmount: Number(financial.paidAmount) + finalAmount,
                remainingAmount: calculation.totalAmount - (Number(financial.paidAmount) + finalAmount),
            }, { transaction });
            // Update booking status and payment status
            const bookingUpdates = {
                paymentStatus: 'PARTIALLY_PAID',
                paymentMethod,
            };
            // Confirm booking if it was PENDING
            if (booking.bookingStatus === 'PENDING') {
                bookingUpdates.bookingStatus = 'CONFIRMED';
            }
            yield booking.update(bookingUpdates, { transaction });
            logger_1.default.info('Deposit processed successfully and booking confirmed', { bookingId, amount: finalAmount });
        }
        else {
            logger_1.default.info('Deposit payment initiated (manual)', { bookingId, method: paymentMethod });
        }
        yield transaction.commit();
        return { payment, financial };
    }
    catch (error) {
        yield transaction.rollback();
        logger_1.default.error('Deposit payment processing failed', { error });
        throw error;
    }
});
exports.processDepositPayment = processDepositPayment;
/**
 * Process balance payment
 */
const processBalancePayment = (bookingId_1, ...args_1) => __awaiter(void 0, [bookingId_1, ...args_1], void 0, function* (bookingId, paymentMethod = 'DROPOFF', stripePaymentIntentId, stripeData) {
    const transaction = yield models_1.sequelize.transaction();
    try {
        const financial = yield models_1.BookingFinancial.findOne({
            where: { bookingId },
            transaction,
            lock: true,
        });
        if (!financial) {
            throw (0, errorHandler_1.createError)('Booking financial record not found', 404);
        }
        const booking = yield models_1.Booking.findByPk(bookingId, { transaction, lock: true });
        if (!booking)
            throw (0, errorHandler_1.createError)('Booking not found', 404);
        // Idempotency check
        const effectiveIntentId = (stripeData === null || stripeData === void 0 ? void 0 : stripeData.paymentIntentId) || stripePaymentIntentId;
        if (effectiveIntentId) {
            const existingPayment = yield models_1.Payment.findOne({
                where: { stripePaymentIntentId: effectiveIntentId, paymentType: 'BALANCE' },
                transaction,
            });
            if (existingPayment) {
                yield transaction.rollback();
                return { payment: existingPayment, financial };
            }
        }
        const balanceAmount = Number(financial.balanceAmount) + Number(financial.delayChargeAmount);
        // Use the remaining platform charge
        const paymentPlatformCharge = financial.platformChargeAmount -
            (financial.paidAmount > 0 ? (financial.paidAmount / financial.totalAmount) * financial.platformChargeAmount : 0);
        // Use Stripe data if provided
        const finalAmount = stripeData ? stripeData.amountReceived : balanceAmount;
        const finalCurrency = stripeData ? stripeData.currency.toUpperCase() : financial.currency;
        const gatewayFee = (stripeData === null || stripeData === void 0 ? void 0 : stripeData.gatewayFee) !== undefined
            ? stripeData.gatewayFee
            : paymentMethod === 'ONLINE'
                ? (finalAmount * GATEWAY_FEE_PERCENT) / 100 + GATEWAY_FEE_FIXED
                : 0;
        // Create balance payment record
        const payment = yield models_1.Payment.create({
            bookingId,
            userId: booking.userId,
            amount: finalAmount,
            currency: finalCurrency,
            paymentType: 'BALANCE',
            paymentStatus: paymentMethod === 'ONLINE' ? 'PAID' : 'UNPAID',
            paymentMethod,
            stripePaymentIntentId: effectiveIntentId,
            stripeChargeId: stripeData === null || stripeData === void 0 ? void 0 : stripeData.chargeId,
            gatewayFeeAmount: gatewayFee,
            platformChargeAmount: paymentPlatformCharge,
            paidAt: paymentMethod === 'ONLINE' ? new Date() : null,
            metadata: stripeData === null || stripeData === void 0 ? void 0 : stripeData.metadata,
        }, { transaction });
        // Update financial record if payment is completed
        if (paymentMethod === 'ONLINE') {
            const newPaidAmount = Number(financial.paidAmount) + balanceAmount;
            yield financial.update({
                paidAmount: newPaidAmount,
                remainingAmount: 0,
            }, { transaction });
            // Update booking payment status
            yield booking.update({
                paymentStatus: 'PAID',
            }, { transaction });
            logger_1.default.info('Balance payment processed successfully', { bookingId, amount: balanceAmount });
        }
        else {
            logger_1.default.info('Balance payment initiated (manual)', { bookingId, method: paymentMethod });
        }
        yield transaction.commit();
        return { payment, financial };
    }
    catch (error) {
        yield transaction.rollback();
        logger_1.default.error('Balance payment processing failed', { error });
        throw error;
    }
});
exports.processBalancePayment = processBalancePayment;
/**
 * Calculate and apply delay charges
 */
const calculateDelayCharges = (bookingId, actualDropoffTime) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield models_1.Booking.findByPk(bookingId, {
        include: [{ model: models_1.Vehicle, attributes: ['delayChargePerHour'] }],
    });
    if (!booking) {
        throw (0, errorHandler_1.createError)('Booking not found', 404);
    }
    const scheduledDropoff = new Date(booking.endDatetime);
    const actualDropoff = new Date(actualDropoffTime);
    // Calculate delay in hours
    const delayMilliseconds = actualDropoff.getTime() - scheduledDropoff.getTime();
    const delayHours = Math.max(0, Math.ceil(delayMilliseconds / (1000 * 60 * 60)));
    const delayChargeRate = booking.Vehicle.delayChargePerHour;
    const delayChargeAmount = delayHours * delayChargeRate;
    return {
        delayHours,
        delayChargeRate,
        delayChargeAmount,
        totalDelayCharge: delayChargeAmount,
    };
});
exports.calculateDelayCharges = calculateDelayCharges;
/**
 * Apply delay charges to booking
 */
const applyDelayCharges = (bookingId, actualDropoffTime) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield models_1.sequelize.transaction();
    try {
        const delayCalculation = yield (0, exports.calculateDelayCharges)(bookingId, actualDropoffTime);
        const booking = yield models_1.Booking.findByPk(bookingId, { transaction, lock: true });
        if (!booking)
            throw (0, errorHandler_1.createError)('Booking not found', 404);
        const financial = yield models_1.BookingFinancial.findOne({
            where: { bookingId },
            transaction,
            lock: true,
        });
        if (!financial)
            throw (0, errorHandler_1.createError)('Booking financial record not found', 404);
        if (delayCalculation.delayHours === 0) {
            yield transaction.commit();
            return { booking, financial };
        }
        logger_1.default.warn('Applying delay charges', { bookingId, delayHours: delayCalculation.delayHours });
        // Update booking with delay information
        yield booking.update({
            actualDropoffDatetime: actualDropoffTime,
            delayChargeApplied: true,
            delayHours: delayCalculation.delayHours,
        }, { transaction });
        // Update financial record with delay charges
        const newTotalAmount = Number(financial.totalAmount) + delayCalculation.delayChargeAmount;
        yield financial.update({
            delayChargeAmount: delayCalculation.delayChargeAmount,
            delayChargeRate: delayCalculation.delayChargeRate,
            totalAmount: newTotalAmount,
            remainingAmount: newTotalAmount - Number(financial.paidAmount),
        }, { transaction });
        // Create delay charge payment record
        const delayCharge = yield models_1.Payment.create({
            bookingId,
            userId: booking.userId,
            amount: delayCalculation.delayChargeAmount,
            currency: financial.currency,
            paymentType: 'DELAY_CHARGE',
            paymentStatus: 'UNPAID',
            paymentMethod: 'DROPOFF',
        }, { transaction });
        // Update booking payment status if there's remaining amount
        if (financial.remainingAmount > 0) {
            yield booking.update({
                paymentStatus: 'PARTIALLY_PAID',
            }, { transaction });
        }
        yield transaction.commit();
        return { booking, financial, delayCharge };
    }
    catch (error) {
        yield transaction.rollback();
        logger_1.default.error('Applying delay charges failed', { error });
        throw error;
    }
});
exports.applyDelayCharges = applyDelayCharges;
/**
 * Get payment summary for a booking
 */
const getPaymentSummary = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield models_1.Booking.findByPk(bookingId, {
        include: [
            {
                model: models_1.BookingFinancial,
            },
            {
                model: models_1.Payment,
                order: [['createdAt', 'ASC']],
            },
            {
                model: models_1.Vehicle,
                attributes: ['make', 'model', 'year', 'pricePerDay', 'delayChargePerHour'],
            },
        ],
    });
    if (!booking) {
        throw (0, errorHandler_1.createError)('Booking not found', 404);
    }
    const payments = booking.Payments || [];
    const financial = booking.BookingFinancial;
    return {
        booking: {
            id: booking.id,
            startDatetime: booking.startDatetime,
            endDatetime: booking.endDatetime,
            actualPickupDatetime: booking.actualPickupDatetime,
            actualDropoffDatetime: booking.actualDropoffDatetime,
            bookingStatus: booking.bookingStatus,
            paymentStatus: booking.paymentStatus,
            paymentMethod: booking.paymentMethod,
            delayChargeApplied: booking.delayChargeApplied,
            delayHours: booking.delayHours,
        },
        financial: financial
            ? {
                baseAmount: financial.baseAmount,
                depositAmount: financial.depositAmount,
                balanceAmount: financial.balanceAmount,
                delayChargeAmount: financial.delayChargeAmount,
                taxAmount: financial.taxAmount,
                totalAmount: financial.totalAmount,
                paidAmount: financial.paidAmount,
                remainingAmount: financial.remainingAmount,
                currency: financial.currency,
            }
            : null,
        payments: payments.map((payment) => ({
            id: payment.id,
            amount: payment.amount,
            paymentType: payment.paymentType,
            paymentStatus: payment.paymentStatus,
            paymentMethod: payment.paymentMethod,
            paidAt: payment.paidAt,
            createdAt: payment.createdAt,
        })),
        vehicle: booking.Vehicle,
    };
});
exports.getPaymentSummary = getPaymentSummary;
/**
 * Mark payment as completed (for pickup/dropoff payments)
 */
const markPaymentCompleted = (paymentId, stripePaymentIntentId) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield models_1.Payment.findByPk(paymentId);
    if (!payment) {
        throw (0, errorHandler_1.createError)('Payment not found', 404);
    }
    yield payment.update({
        paymentStatus: 'PAID',
        paidAt: new Date(),
        stripePaymentIntentId,
    });
    // Update booking financial record
    const financial = yield models_1.BookingFinancial.findOne({
        where: { bookingId: payment.bookingId },
    });
    if (financial) {
        yield financial.update({
            paidAmount: financial.paidAmount + payment.amount,
            remainingAmount: financial.totalAmount - (financial.paidAmount + payment.amount),
        });
    }
    logger_1.default.info('Payment marked as completed', { paymentId, amount: payment.amount });
    return payment;
});
exports.markPaymentCompleted = markPaymentCompleted;
/**
 * Get overdue payments
 */
const getOverduePayments = () => __awaiter(void 0, void 0, void 0, function* () {
    const overdueDate = new Date();
    overdueDate.setHours(overdueDate.getHours() - 24); // 24 hours overdue
    return models_1.Payment.findAll({
        where: {
            paymentStatus: 'UNPAID',
            createdAt: {
                [sequelize_1.Op.lt]: overdueDate,
            },
        },
        include: [
            {
                model: models_1.Booking,
                attributes: ['id', 'bookingStatus', 'endDatetime'],
            },
        ],
    });
});
exports.getOverduePayments = getOverduePayments;
/**
 * Initiate a Stripe PaymentIntent for a booking
 */
const initiatePaymentIntent = (bookingId, paymentType) => __awaiter(void 0, void 0, void 0, function* () {
    const calculation = yield (0, exports.calculatePaymentBreakdown)(bookingId);
    const amount = paymentType === 'DEPOSIT' ? calculation.depositAmount : calculation.balanceAmount + calculation.delayChargeAmount;
    const intent = yield stripe_service_1.stripe.createPaymentIntent({
        amount: Math.round(amount * 100), // Stripe expects cents
        currency: calculation.currency.toLowerCase(),
        metadata: {
            bookingId,
            paymentType,
        },
    });
    return intent;
});
exports.initiatePaymentIntent = initiatePaymentIntent;
//# sourceMappingURL=enhancedPayment.service.js.map