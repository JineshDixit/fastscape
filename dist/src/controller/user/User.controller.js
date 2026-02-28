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
exports.checkBookingEligibility = exports.validateDocumentForBooking = exports.shouldSkipDocumentStep = exports.checkDocumentCompleteness = exports.updateUserProfile = exports.getCurrentUser = void 0;
const userService = __importStar(require("../../services/user/user.service"));
const controller_utils_1 = require("../../utils/controller.utils");
const response_utils_1 = require("../../utils/response.utils");
const models_1 = require("../../models");
class UserController extends controller_utils_1.BaseController {
    constructor() {
        super(...arguments);
        /**
         * Get current user profile
         */
        this.getCurrentUser = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = this.ensureAuthenticated(req);
            const user = yield userService.getUserProfile(userId);
            (0, response_utils_1.sendSuccess)(res, 'Profile retrieved successfully', user);
        }));
        /**
         * Update user profile
         */
        this.updateUserProfile = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = this.ensureAuthenticated(req);
            const updateData = req.body;
            const files = req.files;
            const updatedUser = yield userService.updateUser(userId, updateData, files);
            (0, response_utils_1.sendSuccess)(res, 'Profile updated successfully', updatedUser);
        }));
        /**
         * Check document completeness for booking
         */
        this.checkDocumentCompleteness = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = this.ensureAuthenticated(req);
            const identityDoc = yield models_1.UserIdentityDocument.findOne({ where: { userId } });
            const drivingInfo = yield models_1.UserDrivingInfo.findOne({ where: { userId } });
            const requiredDocuments = ['driverLicenseFront', 'driverLicenseBack', 'passportPhoto', 'selfieWithLicense'];
            const verifiedDocuments = [];
            const missingDocuments = [];
            const unverifiedDocuments = [];
            requiredDocuments.forEach((doc) => {
                const hasDocument = identityDoc && identityDoc[doc];
                if (hasDocument) {
                    if (identityDoc.verificationStatus === 'VERIFIED') {
                        verifiedDocuments.push(doc);
                    }
                    else {
                        unverifiedDocuments.push(doc);
                    }
                }
                else {
                    missingDocuments.push(doc);
                }
            });
            const isComplete = missingDocuments.length === 0 && unverifiedDocuments.length === 0;
            (0, response_utils_1.sendSuccess)(res, 'Document completeness checked', {
                isComplete,
                verifiedDocuments,
                missingDocuments,
                unverifiedDocuments,
            });
        }));
        /**
         * Check if document step should be skipped
         */
        this.shouldSkipDocumentStep = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = this.ensureAuthenticated(req);
            const bookingType = req.query.bookingType || 'SELF_DRIVE';
            const identityDoc = yield models_1.UserIdentityDocument.findOne({ where: { userId } });
            const drivingInfo = yield models_1.UserDrivingInfo.findOne({ where: { userId } });
            // Check if all required documents are uploaded and verified
            const requiredDocuments = ['driverLicenseFront', 'driverLicenseBack', 'passportPhoto', 'selfieWithLicense'];
            const allDocumentsPresent = requiredDocuments.every((doc) => identityDoc && identityDoc[doc]);
            const documentsVerified = (identityDoc === null || identityDoc === void 0 ? void 0 : identityDoc.verificationStatus) === 'VERIFIED';
            const hasDrivingInfo = drivingInfo && drivingInfo.licenseIssuingCountry && drivingInfo.licenseExpiryDate;
            const shouldSkip = allDocumentsPresent && documentsVerified && hasDrivingInfo;
            (0, response_utils_1.sendSuccess)(res, 'Document step check completed', shouldSkip);
        }));
        /**
         * Validate documents for booking
         */
        this.validateDocumentForBooking = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = this.ensureAuthenticated(req);
            const bookingType = req.query.bookingType || 'SELF_DRIVE';
            const identityDoc = yield models_1.UserIdentityDocument.findOne({ where: { userId } });
            const drivingInfo = yield models_1.UserDrivingInfo.findOne({ where: { userId } });
            const requiredDocuments = ['driverLicenseFront', 'driverLicenseBack', 'passportPhoto', 'selfieWithLicense'];
            const missingDocuments = [];
            const unverifiedDocuments = [];
            requiredDocuments.forEach((doc) => {
                const hasDocument = identityDoc && identityDoc[doc];
                if (!hasDocument) {
                    missingDocuments.push(doc);
                }
                else if (identityDoc.verificationStatus !== 'VERIFIED') {
                    unverifiedDocuments.push(doc);
                }
            });
            // Check driving info
            if (!drivingInfo || !drivingInfo.licenseIssuingCountry || !drivingInfo.licenseExpiryDate) {
                missingDocuments.push('drivingInfo');
            }
            const isValid = missingDocuments.length === 0 && unverifiedDocuments.length === 0;
            const canProceedWithBooking = isValid;
            (0, response_utils_1.sendSuccess)(res, 'Document validation completed', {
                isValid,
                missingDocuments,
                unverifiedDocuments,
                canProceedWithBooking,
                message: isValid ? 'All documents are valid' : 'Some documents are missing or unverified',
            });
        }));
        /**
         * Check booking eligibility (comprehensive check with verification config)
         */
        this.checkBookingEligibility = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = this.ensureAuthenticated(req);
            const eligibility = yield userService.checkBookingEligibility(userId);
            (0, response_utils_1.sendSuccess)(res, 'Booking eligibility checked', eligibility);
        }));
    }
}
const userController = new UserController();
exports.getCurrentUser = userController.getCurrentUser, exports.updateUserProfile = userController.updateUserProfile, exports.checkDocumentCompleteness = userController.checkDocumentCompleteness, exports.shouldSkipDocumentStep = userController.shouldSkipDocumentStep, exports.validateDocumentForBooking = userController.validateDocumentForBooking, exports.checkBookingEligibility = userController.checkBookingEligibility;
//# sourceMappingURL=User.controller.js.map