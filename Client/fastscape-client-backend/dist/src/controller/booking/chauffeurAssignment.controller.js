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
exports.checkAssignmentStatus = void 0;
const controller_utils_1 = require("../../utils/controller.utils");
const response_utils_1 = require("../../utils/response.utils");
class ChauffeurAssignmentController extends controller_utils_1.BaseController {
    constructor() {
        super(...arguments);
        /**
         * Check chauffeur assignment status for a booking
         */
        this.checkAssignmentStatus = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const bookingId = this.getValidatedId(req, 'bookingId');
            const { Booking, Chauffeur } = yield Promise.resolve().then(() => __importStar(require('../../models')));
            const booking = yield Booking.findByPk(bookingId, {
                include: [
                    {
                        model: Chauffeur,
                        as: 'chauffeur',
                        attributes: ['id', 'fullName', 'phone', 'rating', 'experienceLevel'],
                        required: false,
                    },
                ],
                attributes: ['id', 'bookingType', 'paymentStatus', 'bookingStatus', 'chauffeurId'],
            });
            if (!booking) {
                return (0, response_utils_1.sendSuccess)(res, 'Booking not found', null, 404);
            }
            const isEligible = booking.bookingType === 'CHAUFFEUR' &&
                booking.paymentStatus === 'PAID' &&
                !booking.chauffeurId &&
                ['CONFIRMED', 'PICKED_UP'].includes(booking.bookingStatus);
            (0, response_utils_1.sendSuccess)(res, 'Assignment status retrieved', {
                bookingId,
                bookingType: booking.bookingType,
                paymentStatus: booking.paymentStatus,
                bookingStatus: booking.bookingStatus,
                chauffeurId: booking.chauffeurId,
                chauffeur: booking.chauffeur,
                isEligibleForAssignment: isEligible,
            });
        }));
    }
}
const chauffeurAssignmentController = new ChauffeurAssignmentController();
exports.checkAssignmentStatus = chauffeurAssignmentController.checkAssignmentStatus;
//# sourceMappingURL=chauffeurAssignment.controller.js.map