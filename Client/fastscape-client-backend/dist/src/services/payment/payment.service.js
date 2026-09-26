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
const database_utils_1 = require("../../utils/database.utils");
const stripe_service_1 = require("./stripe.service");
const chauffeurAssignment_service_1 = require("../booking/chauffeurAssignment.service");
const sequelize_1 = require("sequelize");
const dbEnums_1 = require("../../common/enum/dbEnums");
const logger_1 = __importDefault(require("../../utils/logger"));
const email_utils_1 = require("../../utils/email.utils");
const paymentConfig_1 = require("../../config/payment/paymentConfig");
const decimal_utils_1 = require("../../utils/decimal.utils");
/**
 * Calculate payment breakdown for a booking
 */
const calculatePaymentBreakdown = (bookingId_1, ...args_1) => __awaiter(void 0, [bookingId_1, ...args_1], void 0, function* (bookingId, delayHours = 0) {
    logger_1.default.info('Starting payment breakdown calculation', { bookingId, delayHours });
    const booking = yield models_1.Booking.findByPk(bookingId, {
        include: [
            {
                model: models_1.Vehicle,
                as: 'vehicle',
                attributes: ['pricePerDay', 'delayChargePerHour', 'depositPercentage', 'currency'],
            },
            {
                model: models_1.BookingFinancial,
                as: 'financial',
                attributes: ['baseAmount', 'depositPercentage', 'taxAmount'],
            },
        ],
    });
    if (!booking) {
        logger_1.default.error('Booking not found for payment calculation', { bookingId });
        throw (0, errorHandler_1.createError)('Booking not found', 404);
    }
    const { vehicle } = booking;
    const existingFinancial = booking.financial;
    logger_1.default.info('Booking and vehicle data retrieved', {
        bookingId,
        hasVehicle: !!vehicle,
        hasFinancial: !!existingFinancial,
    });
    if (!vehicle) {
        logger_1.default.error('Vehicle not found for booking', { bookingId });
        throw (0, errorHandler_1.createError)('Vehicle information not found for this booking', 404);
    }
    // Calculate rental duration in days
    const startDate = new Date(booking.startDatetime);
    const endDate = new Date(booking.endDatetime);
    const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    // Base calculations - ensure all values are numbers
    const baseAmount = Number((existingFinancial === null || existingFinancial === void 0 ? void 0 : existingFinancial.baseAmount) || vehicle.pricePerDay * rentalDays);
    const depositPercentage = Number((existingFinancial === null || existingFinancial === void 0 ? void 0 : existingFinancial.depositPercentage) || vehicle.depositPercentage);
    const depositAmount = (baseAmount * depositPercentage) / 100;
    const balanceAmount = baseAmount - depositAmount;
    // Delay charge calculation
    const delayChargeRate = Number(vehicle.delayChargePerHour || 0);
    const delayChargeAmount = delayHours > 0 ? (0, decimal_utils_1.multiplyDecimal)(delayHours, delayChargeRate) : 0;
    // Tax calculation using config
    const taxRate = paymentConfig_1.paymentConfig.taxRate;
    // Platform charge calculation
    const platformChargeRate = Number((existingFinancial === null || existingFinancial === void 0 ? void 0 : existingFinancial.platformChargeRate) || paymentConfig_1.paymentConfig.platformChargeRate);
    const platformChargeAmount = Number(existingFinancial === null || existingFinancial === void 0 ? void 0 : existingFinancial.platformChargeAmount) || (0, decimal_utils_1.calculatePercentage)(baseAmount, platformChargeRate);
    const subtotal = (0, decimal_utils_1.addDecimal)((0, decimal_utils_1.addDecimal)(baseAmount, delayChargeAmount), platformChargeAmount);
    const taxAmount = Number(existingFinancial === null || existingFinancial === void 0 ? void 0 : existingFinancial.taxAmount) || (0, decimal_utils_1.multiplyDecimal)(subtotal, taxRate);
    const totalAmount = (0, decimal_utils_1.addDecimal)(subtotal, taxAmount);
    // Return in frontend-compatible format (strings)
    const result = {
        baseAmount: Number(baseAmount).toFixed(2),
        depositAmount: Number(depositAmount).toFixed(2),
        balanceAmount: Number(balanceAmount).toFixed(2),
        taxAmount: Number(taxAmount).toFixed(2),
        delayCharges: delayChargeAmount > 0 ? Number(delayChargeAmount).toFixed(2) : undefined,
        totalAmount: Number(totalAmount).toFixed(2),
        currency: vehicle.currency || 'USD',
        daysCount: rentalDays,
        delayHours: delayHours > 0 ? delayHours : undefined,
        depositPercentage: Number(depositPercentage),
        platformChargeAmount: Number(platformChargeAmount).toFixed(2),
        platformChargeRate: Number(platformChargeRate),
    };
    logger_1.default.info('Payment breakdown calculated successfully', { bookingId, result });
    return result;
});
exports.calculatePaymentBreakdown = calculatePaymentBreakdown;
/**
 * Process deposit payment
 */
const processDepositPayment = (bookingId_1, ...args_1) => __awaiter(void 0, [bookingId_1, ...args_1], void 0, function* (bookingId, paymentMethod = 'ONLINE', stripePaymentIntentId, stripeData, paymentTypeOverride) {
    var _a, _b, _c;
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
        // Store old booking state for audit
        const oldBookingState = {
            bookingStatus: booking.bookingStatus,
            paymentStatus: booking.paymentStatus,
            paymentMethod: booking.paymentMethod,
        };
        // Check if booking has expired
        if (booking.bookingStatus === dbEnums_1.dbEnums.BOOKING_STATUS[0] &&
            booking.expiresAt &&
            new Date() > new Date(booking.expiresAt)) {
            // 'PENDING'
            logger_1.default.warn('Processing payment for expired booking - re-checking availability', { bookingId });
            // Re-check availability
            const conflictingBooking = yield models_1.Booking.findOne({
                where: {
                    vehicleId: booking.vehicleId,
                    id: { [sequelize_1.Op.ne]: bookingId }, // Exclude current booking
                    [sequelize_1.Op.and]: [
                        (0, database_utils_1.buildDateConflictConditions)(booking.startDatetime, booking.endDatetime),
                        {
                            [sequelize_1.Op.or]: [
                                { bookingStatus: dbEnums_1.dbEnums.BOOKING_STATUS[1] }, // 'CONFIRMED'
                                {
                                    bookingStatus: dbEnums_1.dbEnums.BOOKING_STATUS[0], // 'PENDING'
                                    [sequelize_1.Op.or]: [{ expiresAt: { [sequelize_1.Op.eq]: null } }, { expiresAt: { [sequelize_1.Op.gt]: new Date() } }],
                                },
                            ],
                        },
                    ],
                },
                transaction,
                lock: true,
            });
            if (conflictingBooking) {
                throw (0, errorHandler_1.createError)('Booking expired and vehicle is no longer available', 409);
            }
        }
        // Idempotency check: prevent duplicate payment records for the same intent
        const effectiveIntentId = (stripeData === null || stripeData === void 0 ? void 0 : stripeData.paymentIntentId) || stripePaymentIntentId;
        if (effectiveIntentId) {
            const existingPayment = yield models_1.Payment.findOne({
                where: {
                    stripePaymentIntentId: effectiveIntentId,
                    paymentType: { [sequelize_1.Op.in]: [dbEnums_1.dbEnums.PAYMENT_TYPE[0], dbEnums_1.dbEnums.PAYMENT_TYPE[4]] }, // 'DEPOSIT' and 'FULL'
                },
                transaction,
            });
            if (existingPayment) {
                logger_1.default.info('Duplicate payment attempt detected - returning existing payment', {
                    intentId: effectiveIntentId,
                    existingPaymentId: existingPayment.id,
                });
                yield transaction.rollback();
                return { payment: existingPayment, financial };
            }
        }
        // If we have an ID but no data yet (client-side confirmation), fetch it from Stripe
        let effectiveStripeData = stripeData;
        if (stripePaymentIntentId && !effectiveStripeData) {
            try {
                const intent = yield stripe_service_1.stripe.retrievePaymentIntent(stripePaymentIntentId);
                if (intent && (intent.status === 'succeeded' || intent.status === 'processing')) {
                    effectiveStripeData = {
                        amountReceived: intent.amount_received / 100,
                        currency: intent.currency,
                        paymentIntentId: intent.id,
                        chargeId: intent.latest_charge,
                        metadata: intent.metadata,
                    };
                    logger_1.default.info('Retrieved Stripe intent for processing', {
                        intentId: intent.id,
                        paymentType: (_a = intent.metadata) === null || _a === void 0 ? void 0 : _a.paymentType,
                    });
                }
            }
            catch (err) {
                logger_1.default.warn('Failed to retrieve Stripe intent', { stripePaymentIntentId, err });
            }
        }
        // Determine portion of platform charge
        const isFullPayment = paymentTypeOverride === 'FULL' || ((_b = effectiveStripeData === null || effectiveStripeData === void 0 ? void 0 : effectiveStripeData.metadata) === null || _b === void 0 ? void 0 : _b.paymentType) === 'FULL';
        // Calculate portion of platform charge for this payment
        const paymentPlatformCharge = isFullPayment
            ? calculation.platformChargeAmount
            : (calculation.depositAmount / calculation.totalAmount) * calculation.platformChargeAmount;
        // Use Stripe data if provided, otherwise fallback to calculations
        const finalAmount = effectiveStripeData
            ? effectiveStripeData.amountReceived
            : isFullPayment
                ? calculation.totalAmount
                : calculation.depositAmount;
        const finalCurrency = effectiveStripeData ? effectiveStripeData.currency.toUpperCase() : calculation.currency;
        const gatewayFee = (effectiveStripeData === null || effectiveStripeData === void 0 ? void 0 : effectiveStripeData.gatewayFee) !== undefined
            ? effectiveStripeData.gatewayFee
            : paymentMethod === 'ONLINE'
                ? (0, decimal_utils_1.addDecimal)((0, decimal_utils_1.calculatePercentage)(finalAmount, paymentConfig_1.paymentConfig.gatewayFeePercent), paymentConfig_1.paymentConfig.gatewayFeeFixed)
                : 0;
        // Determine payment type from metadata or override
        const paymentTypeValue = ((_c = effectiveStripeData === null || effectiveStripeData === void 0 ? void 0 : effectiveStripeData.metadata) === null || _c === void 0 ? void 0 : _c.paymentType) || paymentTypeOverride || 'DEPOSIT';
        const paymentTypeEnum = paymentTypeValue === 'FULL' ? dbEnums_1.dbEnums.PAYMENT_TYPE[4] : dbEnums_1.dbEnums.PAYMENT_TYPE[0]; // 'FULL' or 'DEPOSIT'
        const payment = yield models_1.Payment.create({
            bookingId,
            userId: booking.userId,
            amount: finalAmount,
            currency: finalCurrency,
            paymentType: paymentTypeEnum,
            paymentStatus: paymentMethod === 'ONLINE' ? dbEnums_1.dbEnums.PAYMENT_STATUS[2] : dbEnums_1.dbEnums.PAYMENT_STATUS[0], // 'PAID' or 'UNPAID'
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
            const newPaidAmount = (0, decimal_utils_1.addDecimal)(Number(financial.paidAmount), finalAmount);
            const newRemainingAmount = Math.max(0, (0, decimal_utils_1.subtractDecimal)(calculation.totalAmount, newPaidAmount));
            yield financial.update({
                paidAmount: newPaidAmount,
                remainingAmount: newRemainingAmount,
            }, { transaction });
            // Update booking status and payment status
            // Dynamically determine payment status: if paid >= total, it's PAID, else PARTIALLY_PAID
            const isFullyPaid = (0, decimal_utils_1.isGreaterOrEqualDecimal)(newPaidAmount, calculation.totalAmount, paymentConfig_1.paymentConfig.comparisonDelta);
            const bookingUpdates = {
                paymentStatus: isFullyPaid ? dbEnums_1.dbEnums.PAYMENT_STATUS[2] : dbEnums_1.dbEnums.PAYMENT_STATUS[1], // 'PAID' or 'PARTIALLY_PAID'
                paymentMethod,
            };
            // Confirm booking if it was PENDING
            if (booking.bookingStatus === dbEnums_1.dbEnums.BOOKING_STATUS[0]) {
                // 'PENDING'
                bookingUpdates.bookingStatus = dbEnums_1.dbEnums.BOOKING_STATUS[1]; // 'CONFIRMED'
                bookingUpdates.expiresAt = null;
            }
            yield booking.update(bookingUpdates, { transaction });
            logger_1.default.info('Deposit processed successfully and booking confirmed', { bookingId, amount: finalAmount });
            // Send booking confirmation email if booking was just confirmed (non-blocking)
            if (oldBookingState.bookingStatus === dbEnums_1.dbEnums.BOOKING_STATUS[0] &&
                bookingUpdates.bookingStatus === dbEnums_1.dbEnums.BOOKING_STATUS[1]) {
                (0, email_utils_1.sendBookingConfirmation)(bookingId).catch((error) => {
                    logger_1.default.error('Failed to send booking confirmation email', { bookingId, error });
                });
            }
            // Send payment confirmation email (non-blocking)
            (0, email_utils_1.sendPaymentConfirmation)(bookingId, paymentTypeEnum === dbEnums_1.dbEnums.PAYMENT_TYPE[4] ? 'Full Payment' : 'Deposit', finalAmount.toString(), finalCurrency, paymentMethod).catch((error) => {
                logger_1.default.error('Failed to send payment confirmation email', { bookingId, error });
            });
        }
        else {
            logger_1.default.info('Deposit payment initiated (manual)', { bookingId, method: paymentMethod });
        }
        yield transaction.commit();
        // Trigger chauffeur assignment for CHAUFFEUR bookings AFTER commit to avoid race conditions
        if (paymentMethod === 'ONLINE' && booking.bookingType === dbEnums_1.dbEnums.BOOKING_TYPE[1]) {
            // 'CHAUFFEUR'
            // Re-fetch or check state to see if assignment is needed
            const isInitialConfirmation = oldBookingState.bookingStatus === dbEnums_1.dbEnums.BOOKING_STATUS[0] &&
                booking.bookingStatus === dbEnums_1.dbEnums.BOOKING_STATUS[1];
            // Use safe decimal comparison
            const isFullyPaid = (0, decimal_utils_1.isGreaterOrEqualDecimal)(Number(financial.paidAmount), calculation.totalAmount, paymentConfig_1.paymentConfig.comparisonDelta);
            if (isFullyPaid || isInitialConfirmation) {
                // Don't wait for assignment to complete - trigger asynchronously
                (0, chauffeurAssignment_service_1.triggerChauffeurAssignmentOnPayment)(bookingId, paymentTypeEnum === dbEnums_1.dbEnums.PAYMENT_TYPE[4] ? 'FULL' : 'DEPOSIT').catch((error) => {
                    logger_1.default.error('Async chauffeur assignment failed after transaction commit', { bookingId, error });
                });
            }
        }
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
                where: {
                    stripePaymentIntentId: effectiveIntentId,
                    paymentType: dbEnums_1.dbEnums.PAYMENT_TYPE[1], // 'BALANCE'
                },
                transaction,
            });
            if (existingPayment) {
                logger_1.default.info('Duplicate balance payment attempt detected - returning existing payment', {
                    intentId: effectiveIntentId,
                    existingPaymentId: existingPayment.id,
                });
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
                ? (0, decimal_utils_1.addDecimal)((0, decimal_utils_1.calculatePercentage)(finalAmount, paymentConfig_1.paymentConfig.gatewayFeePercent), paymentConfig_1.paymentConfig.gatewayFeeFixed)
                : 0;
        // Create balance payment record
        const payment = yield models_1.Payment.create({
            bookingId,
            userId: booking.userId,
            amount: finalAmount,
            currency: finalCurrency,
            paymentType: dbEnums_1.dbEnums.PAYMENT_TYPE[1], // 'BALANCE'
            paymentStatus: paymentMethod === 'ONLINE' ? dbEnums_1.dbEnums.PAYMENT_STATUS[2] : dbEnums_1.dbEnums.PAYMENT_STATUS[0], // 'PAID' or 'UNPAID'
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
            const newPaidAmount = (0, decimal_utils_1.addDecimal)(Number(financial.paidAmount), balanceAmount);
            yield financial.update({
                paidAmount: (0, decimal_utils_1.roundDecimal)(newPaidAmount),
                remainingAmount: 0,
            }, { transaction });
            // Update booking payment status
            yield booking.update({
                paymentStatus: dbEnums_1.dbEnums.PAYMENT_STATUS[2], // 'PAID'
            }, { transaction });
            logger_1.default.info('Balance payment processed successfully', { bookingId, amount: balanceAmount });
            // Send payment confirmation email (non-blocking)
            (0, email_utils_1.sendPaymentConfirmation)(bookingId, 'Balance Payment', balanceAmount.toString(), finalCurrency, paymentMethod).catch((error) => {
                logger_1.default.error('Failed to send payment confirmation email', { bookingId, error });
            });
        }
        else {
            logger_1.default.info('Balance payment initiated (manual)', { bookingId, method: paymentMethod });
        }
        yield transaction.commit();
        // Trigger chauffeur assignment for CHAUFFEUR bookings AFTER commit to avoid race conditions
        if (paymentMethod === 'ONLINE' && booking.bookingType === dbEnums_1.dbEnums.BOOKING_TYPE[1]) {
            // 'CHAUFFEUR'
            // Don't wait for assignment to complete - trigger asynchronously
            (0, chauffeurAssignment_service_1.triggerChauffeurAssignmentOnPayment)(bookingId, 'BALANCE').catch((error) => {
                logger_1.default.error('Async chauffeur assignment failed after transaction commit (balance)', { bookingId, error });
            });
        }
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
        include: [{ model: models_1.Vehicle, as: 'vehicle', attributes: ['delayChargePerHour'] }],
    });
    if (!booking) {
        throw (0, errorHandler_1.createError)('Booking not found', 404);
    }
    const scheduledDropoff = new Date(booking.endDatetime);
    const actualDropoff = new Date(actualDropoffTime);
    // Calculate delay in hours
    const delayMilliseconds = actualDropoff.getTime() - scheduledDropoff.getTime();
    const delayHours = Math.max(0, Math.ceil(delayMilliseconds / (1000 * 60 * 60)));
    const delayChargeRate = booking.vehicle.delayChargePerHour;
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
            paymentType: dbEnums_1.dbEnums.PAYMENT_TYPE[2], // 'DELAY_CHARGE'
            paymentStatus: dbEnums_1.dbEnums.PAYMENT_STATUS[0], // 'UNPAID'
            paymentMethod: dbEnums_1.dbEnums.PAYMENT_METHOD[1], // 'DROPOFF'
        }, { transaction });
        // Update booking payment status if there's remaining amount
        if (financial.remainingAmount > 0) {
            yield booking.update({
                paymentStatus: dbEnums_1.dbEnums.PAYMENT_STATUS[1], // 'PARTIALLY_PAID'
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
                as: 'financial',
            },
            {
                model: models_1.Payment,
                as: 'payments',
                order: [['createdAt', 'ASC']],
            },
            {
                model: models_1.Vehicle,
                as: 'vehicle',
                attributes: ['make', 'model', 'year', 'pricePerDay', 'delayChargePerHour'],
            },
        ],
    });
    if (!booking) {
        throw (0, errorHandler_1.createError)('Booking not found', 404);
    }
    const payments = booking.payments || [];
    const { financial } = booking;
    // Calculate total paid amount from successful payments
    const totalPaid = payments
        .filter((payment) => payment.paymentStatus === 'PAID')
        .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0)
        .toString();
    // Calculate remaining balance
    const totalAmount = financial ? parseFloat(financial.totalAmount || 0) : 0;
    const remainingBalance = (totalAmount - parseFloat(totalPaid || 0)).toString();
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
        totalPaid,
        remainingBalance,
        vehicle: booking.vehicle,
    };
});
exports.getPaymentSummary = getPaymentSummary;
/**
 * Mark payment as completed (for pickup/dropoff payments)
 */
const markPaymentCompleted = (paymentId, stripePaymentIntentId) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield models_1.sequelize.transaction();
    try {
        const payment = yield models_1.Payment.findByPk(paymentId, { transaction, lock: true });
        if (!payment) {
            throw (0, errorHandler_1.createError)('Payment not found', 404);
        }
        if (payment.paymentStatus === 'PAID') {
            yield transaction.rollback();
            return payment;
        }
        yield payment.update({
            paymentStatus: 'PAID',
            paidAt: new Date(),
            stripePaymentIntentId,
        }, { transaction });
        // Update booking financial record
        const financial = yield models_1.BookingFinancial.findOne({
            where: { bookingId: payment.bookingId },
            transaction,
            lock: true,
        });
        if (financial) {
            const newPaidAmount = (0, decimal_utils_1.addDecimal)(Number(financial.paidAmount), Number(payment.amount));
            const newRemainingAmount = Math.max(0, (0, decimal_utils_1.subtractDecimal)(Number(financial.totalAmount), newPaidAmount));
            yield financial.update({
                paidAmount: (0, decimal_utils_1.roundDecimal)(newPaidAmount),
                remainingAmount: (0, decimal_utils_1.roundDecimal)(newRemainingAmount),
            }, { transaction });
            // Update booking payment status
            const booking = yield models_1.Booking.findByPk(payment.bookingId, { transaction, lock: true });
            if (booking) {
                const isFullyPaid = (0, decimal_utils_1.isGreaterOrEqualDecimal)(newPaidAmount, Number(financial.totalAmount), paymentConfig_1.paymentConfig.comparisonDelta);
                yield booking.update({
                    paymentStatus: isFullyPaid ? dbEnums_1.dbEnums.PAYMENT_STATUS[2] : dbEnums_1.dbEnums.PAYMENT_STATUS[1], // 'PAID' or 'PARTIALLY_PAID'
                }, { transaction });
            }
        }
        yield transaction.commit();
        // Trigger chauffeur assignment for CHAUFFEUR bookings AFTER commit to avoid race conditions
        // This is useful for manual payment confirmations (pickup/dropoff payments)
        const booking = yield models_1.Booking.findByPk(payment.bookingId);
        if (booking && booking.bookingType === dbEnums_1.dbEnums.BOOKING_TYPE[1]) {
            // 'CHAUFFEUR'
            (0, chauffeurAssignment_service_1.triggerChauffeurAssignmentOnPayment)(payment.bookingId, 'BALANCE').catch((error) => {
                logger_1.default.error('Async chauffeur assignment failed after manual payment confirmation commit', {
                    bookingId: payment.bookingId,
                    error,
                });
            });
        }
        logger_1.default.info('Payment marked as completed and booking status updated', {
            paymentId,
            amount: payment.amount,
            bookingId: payment.bookingId,
        });
        return payment;
    }
    catch (error) {
        yield transaction.rollback();
        logger_1.default.error('Failed to mark payment as completed', { error, paymentId });
        throw error;
    }
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
            paymentStatus: dbEnums_1.dbEnums.PAYMENT_STATUS[0], // 'UNPAID'
            createdAt: {
                [sequelize_1.Op.lt]: overdueDate,
            },
        },
        include: [
            {
                model: models_1.Booking,
                as: 'booking',
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
    // Convert string amounts back to numbers for calculation
    const depositAmount = parseFloat(calculation.depositAmount);
    const totalAmount = parseFloat(calculation.totalAmount);
    const balanceAmount = parseFloat(calculation.balanceAmount);
    const delayChargeAmount = calculation.delayCharges ? parseFloat(calculation.delayCharges) : 0;
    const amount = paymentType === 'DEPOSIT'
        ? depositAmount
        : paymentType === 'FULL'
            ? totalAmount
            : (0, decimal_utils_1.addDecimal)(balanceAmount, delayChargeAmount);
    return yield stripe_service_1.stripe.createPaymentIntent({
        amount: (0, decimal_utils_1.toCents)(amount), // Convert to cents using utility
        currency: calculation.currency.toLowerCase(),
        metadata: {
            bookingId,
            paymentType,
        },
    });
});
exports.initiatePaymentIntent = initiatePaymentIntent;
//# sourceMappingURL=payment.service.js.map