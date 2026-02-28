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
exports.markVehicleDroppedOff = exports.markVehiclePickedUp = exports.getOverduePaymentsList = exports.completePayment = exports.getBookingPaymentSummary = exports.applyDelayCharge = exports.processBalance = exports.processDeposit = exports.initiateIntent = exports.calculatePayment = void 0;
const errorHandler_1 = require("../../services/middleware/errorHandler");
const payment_service_1 = require("../../services/payment/payment.service");
const controller_utils_1 = require("../../utils/controller.utils");
const response_utils_1 = require("../../utils/response.utils");
const validation_utils_1 = require("../../utils/validation.utils");
const dbEnums_1 = require("../../common/enum/dbEnums");
const logger_1 = __importDefault(require("../../utils/logger"));
class PaymentController extends controller_utils_1.BaseController {
    constructor() {
        super(...arguments);
        /**
         * Calculate payment breakdown for a booking
         */
        this.calculatePayment = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const bookingId = this.getValidatedId(req, 'bookingId');
            const { delayHours = 0 } = req.query;
            logger_1.default.info('Calculating payment breakdown', { bookingId, delayHours });
            const calculation = yield (0, payment_service_1.calculatePaymentBreakdown)(bookingId, Number(delayHours));
            logger_1.default.info('Payment calculation completed', { bookingId, calculation });
            (0, response_utils_1.sendSuccess)(res, 'Payment calculation completed', calculation);
        }));
        /**
         * Initiate a Stripe PaymentIntent
         */
        this.initiateIntent = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const bookingId = this.getValidatedId(req, 'bookingId');
            const { paymentType } = req.body;
            (0, validation_utils_1.validateRequiredFields)({ paymentType }, ['paymentType']);
            if (!['DEPOSIT', 'BALANCE', 'FULL'].includes(paymentType)) {
                throw (0, errorHandler_1.createError)('Invalid payment type. Must be DEPOSIT, BALANCE or FULL', 400);
            }
            const intent = yield (0, payment_service_1.initiatePaymentIntent)(bookingId, paymentType);
            (0, response_utils_1.sendSuccess)(res, 'Payment intent created successfully', intent);
        }));
        /**
         * Process deposit payment
         */
        this.processDeposit = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const bookingId = this.getValidatedId(req, 'bookingId');
            const { paymentMethod = 'ONLINE', stripePaymentIntentId, paymentType } = req.body;
            const result = yield (0, payment_service_1.processDepositPayment)(bookingId, paymentMethod, stripePaymentIntentId, undefined, paymentType);
            (0, response_utils_1.sendSuccess)(res, 'Deposit payment processed successfully', {
                payment: result.payment,
                financial: result.financial,
            });
        }));
        /**
         * Process balance payment
         */
        this.processBalance = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const bookingId = this.getValidatedId(req, 'bookingId');
            const { paymentMethod = 'DROPOFF', stripePaymentIntentId } = req.body;
            const result = yield (0, payment_service_1.processBalancePayment)(bookingId, paymentMethod, stripePaymentIntentId);
            (0, response_utils_1.sendSuccess)(res, 'Balance payment processed successfully', {
                payment: result.payment,
                financial: result.financial,
            });
        }));
        /**
         * Apply delay charges when vehicle is returned late
         */
        this.applyDelayCharge = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const bookingId = this.getValidatedId(req, 'bookingId');
            const { actualDropoffTime } = req.body;
            (0, validation_utils_1.validateRequiredFields)({ actualDropoffTime }, ['actualDropoffTime']);
            const result = yield (0, payment_service_1.applyDelayCharges)(bookingId, new Date(actualDropoffTime));
            const message = result.delayCharge
                ? 'Delay charges applied successfully'
                : 'No delay charges applied - vehicle returned on time';
            (0, response_utils_1.sendSuccess)(res, message, {
                booking: result.booking,
                financial: result.financial,
                delayCharge: result.delayCharge || null,
            });
        }));
        /**
         * Get payment summary for a booking
         */
        this.getBookingPaymentSummary = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const bookingId = this.getValidatedId(req, 'bookingId');
            const summary = yield (0, payment_service_1.getPaymentSummary)(bookingId);
            (0, response_utils_1.sendSuccess)(res, 'Payment summary retrieved successfully', summary);
        }));
        /**
         * Mark a payment as completed (for pickup/dropoff payments)
         */
        this.completePayment = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const paymentId = this.getValidatedId(req, 'paymentId');
            const { stripePaymentIntentId } = req.body;
            const payment = yield (0, payment_service_1.markPaymentCompleted)(paymentId, stripePaymentIntentId);
            (0, response_utils_1.sendSuccess)(res, 'Payment marked as completed', payment);
        }));
        /**
         * Get all overdue payments (Admin only)
         */
        this.getOverduePaymentsList = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const overduePayments = yield (0, payment_service_1.getOverduePayments)();
            (0, response_utils_1.sendSuccess)(res, 'Overdue payments retrieved successfully', {
                count: overduePayments.length,
                payments: overduePayments,
            });
        }));
        /**
         * Update booking status to picked up
         */
        this.markVehiclePickedUp = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const bookingId = this.getValidatedId(req, 'bookingId');
            const { actualPickupTime = new Date() } = req.body;
            const { Booking } = yield Promise.resolve().then(() => __importStar(require('../../models')));
            const booking = yield Booking.findByPk(bookingId);
            if (!booking) {
                return (0, response_utils_1.sendSuccess)(res, 'Booking not found', null, 404);
            }
            yield booking.update({
                bookingStatus: dbEnums_1.dbEnums.BOOKING_STATUS[2], // 'PICKED_UP'
                actualPickupDatetime: new Date(actualPickupTime),
            });
            (0, response_utils_1.sendSuccess)(res, 'Vehicle marked as picked up', booking);
        }));
        /**
         * Update booking status to dropped off
         */
        this.markVehicleDroppedOff = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const bookingId = this.getValidatedId(req, 'bookingId');
            const { actualDropoffTime = new Date() } = req.body;
            // Apply delay charges if any
            const result = yield (0, payment_service_1.applyDelayCharges)(bookingId, new Date(actualDropoffTime));
            // Update booking status
            yield result.booking.update({
                bookingStatus: dbEnums_1.dbEnums.BOOKING_STATUS[3], // 'DROPPED_OFF'
            });
            (0, response_utils_1.sendSuccess)(res, 'Vehicle marked as dropped off', {
                booking: result.booking,
                financial: result.financial,
                delayCharge: result.delayCharge || null,
                hasDelayCharges: !!result.delayCharge,
            });
        }));
    }
}
const paymentController = new PaymentController();
exports.calculatePayment = paymentController.calculatePayment, exports.initiateIntent = paymentController.initiateIntent, exports.processDeposit = paymentController.processDeposit, exports.processBalance = paymentController.processBalance, exports.applyDelayCharge = paymentController.applyDelayCharge, exports.getBookingPaymentSummary = paymentController.getBookingPaymentSummary, exports.completePayment = paymentController.completePayment, exports.getOverduePaymentsList = paymentController.getOverduePaymentsList, exports.markVehiclePickedUp = paymentController.markVehiclePickedUp, exports.markVehicleDroppedOff = paymentController.markVehicleDroppedOff;
//# sourceMappingURL=payment.controller.js.map