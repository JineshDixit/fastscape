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
exports.sendChauffeurAssignment = exports.sendPaymentConfirmation = exports.sendBookingCancellation = exports.sendBookingConfirmation = void 0;
const models_1 = require("../models");
const email_service_1 = require("../services/email/email.service");
const logger_1 = __importDefault(require("./logger"));
/**
 * Send booking confirmation email with booking details
 */
const sendBookingConfirmation = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const booking = yield models_1.Booking.findByPk(bookingId, {
            include: [
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['email', 'firstName'],
                },
                {
                    model: models_1.Vehicle,
                    as: 'vehicle',
                    attributes: ['make', 'model', 'year'],
                },
            ],
        });
        if (!booking) {
            logger_1.default.warn('Booking not found for confirmation email', { bookingId });
            return;
        }
        const user = booking.user;
        const vehicle = booking.vehicle;
        if (!user || !vehicle) {
            logger_1.default.warn('User or vehicle not found for booking confirmation email', { bookingId });
            return;
        }
        const vehicleName = `${vehicle.make} ${vehicle.model} ${vehicle.year}`;
        yield (0, email_service_1.sendBookingConfirmationEmail)(user.email, {
            firstName: user.firstName,
            bookingId: booking.id,
            vehicleName,
            startDate: new Date(booking.startDatetime).toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'short',
            }),
            endDate: new Date(booking.endDatetime).toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'short',
            }),
            pickupLocation: booking.pickupLocation,
            dropoffLocation: booking.dropoffLocation,
            totalAmount: '0.00', // Will be calculated from financial record
            currency: 'USD',
            bookingType: booking.bookingType,
        });
        logger_1.default.info('Booking confirmation email sent', { bookingId, email: user.email });
    }
    catch (error) {
        logger_1.default.error('Failed to send booking confirmation email', { bookingId, error });
    }
});
exports.sendBookingConfirmation = sendBookingConfirmation;
/**
 * Send booking cancellation email
 */
const sendBookingCancellation = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const booking = yield models_1.Booking.findByPk(bookingId, {
            include: [
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['email', 'firstName'],
                },
                {
                    model: models_1.Vehicle,
                    as: 'vehicle',
                    attributes: ['make', 'model', 'year'],
                },
            ],
        });
        if (!booking) {
            logger_1.default.warn('Booking not found for cancellation email', { bookingId });
            return;
        }
        const user = booking.user;
        const vehicle = booking.vehicle;
        if (!user || !vehicle) {
            logger_1.default.warn('User or vehicle not found for booking cancellation email', { bookingId });
            return;
        }
        const vehicleName = `${vehicle.make} ${vehicle.model} ${vehicle.year}`;
        yield (0, email_service_1.sendBookingCancelledEmail)(user.email, {
            firstName: user.firstName,
            bookingId: booking.id,
            vehicleName,
            cancellationDate: new Date().toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'short',
            }),
        });
        logger_1.default.info('Booking cancellation email sent', { bookingId, email: user.email });
    }
    catch (error) {
        logger_1.default.error('Failed to send booking cancellation email', { bookingId, error });
    }
});
exports.sendBookingCancellation = sendBookingCancellation;
/**
 * Send payment confirmation email
 */
const sendPaymentConfirmation = (bookingId, paymentType, amount, currency, paymentMethod) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const booking = yield models_1.Booking.findByPk(bookingId, {
            include: [
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['email', 'firstName'],
                },
            ],
        });
        if (!booking) {
            logger_1.default.warn('Booking not found for payment confirmation email', { bookingId });
            return;
        }
        const user = booking.user;
        if (!user) {
            logger_1.default.warn('User not found for payment confirmation email', { bookingId });
            return;
        }
        yield (0, email_service_1.sendPaymentConfirmationEmail)(user.email, {
            firstName: user.firstName,
            bookingId: booking.id,
            paymentType,
            amount,
            currency,
            paymentDate: new Date().toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'short',
            }),
            paymentMethod,
        });
        logger_1.default.info('Payment confirmation email sent', { bookingId, email: user.email });
    }
    catch (error) {
        logger_1.default.error('Failed to send payment confirmation email', { bookingId, error });
    }
});
exports.sendPaymentConfirmation = sendPaymentConfirmation;
/**
 * Send chauffeur assignment email
 */
const sendChauffeurAssignment = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const booking = yield models_1.Booking.findByPk(bookingId, {
            include: [
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['email', 'firstName'],
                },
                {
                    model: models_1.Vehicle,
                    as: 'vehicle',
                    attributes: ['make', 'model', 'year'],
                },
                {
                    model: models_1.Chauffeur,
                    as: 'chauffeur',
                    attributes: ['fullName', 'phone', 'rating', 'experienceLevel', 'languages'],
                },
            ],
        });
        if (!booking) {
            logger_1.default.warn('Booking not found for chauffeur assignment email', { bookingId });
            return;
        }
        const user = booking.user;
        const vehicle = booking.vehicle;
        const chauffeur = booking.chauffeur;
        if (!user || !vehicle || !chauffeur) {
            logger_1.default.warn('User, vehicle, or chauffeur not found for chauffeur assignment email', { bookingId });
            return;
        }
        const vehicleName = `${vehicle.make} ${vehicle.model} ${vehicle.year}`;
        yield (0, email_service_1.sendChauffeurAssignedEmail)(user.email, {
            firstName: user.firstName,
            bookingId: booking.id,
            vehicleName,
            chauffeurName: chauffeur.fullName,
            chauffeurPhone: chauffeur.phone,
            chauffeurRating: chauffeur.rating,
            chauffeurExperience: chauffeur.experienceLevel,
            chauffeurLanguages: chauffeur.languages,
            startDate: new Date(booking.startDatetime).toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'short',
            }),
            pickupLocation: booking.pickupLocation,
        });
        logger_1.default.info('Chauffeur assignment email sent', { bookingId, email: user.email });
    }
    catch (error) {
        logger_1.default.error('Failed to send chauffeur assignment email', { bookingId, error });
    }
});
exports.sendChauffeurAssignment = sendChauffeurAssignment;
//# sourceMappingURL=email.utils.js.map