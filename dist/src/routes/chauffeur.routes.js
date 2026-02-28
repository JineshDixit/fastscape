"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const chauffeur_controller_1 = require("../controller/chauffeur/chauffeur.controller");
const authenticateUser_1 = require("../services/middleware/authenticateUser");
const validation_1 = require("../services/middleware/validation");
const router = (0, express_1.Router)();
// Apply authentication to all chauffeur routes
router.use(authenticateUser_1.authenticateUser);
/**
 * @route GET /api/chauffeurs/available
 * @desc Get available chauffeurs for a time period
 * @access Private
 */
router.get('/available', [
    (0, express_validator_1.query)('startDatetime').isISO8601().withMessage('Valid start datetime is required'),
    (0, express_validator_1.query)('endDatetime').isISO8601().withMessage('Valid end datetime is required'),
    (0, express_validator_1.query)('vehicleType').optional().isString().withMessage('Vehicle type must be a string'),
    (0, express_validator_1.query)('city').optional().isString().withMessage('City must be a string'),
    (0, express_validator_1.query)('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Minimum rating must be between 0 and 5'),
    (0, express_validator_1.query)('maxHourlyRate').optional().isFloat({ min: 0 }).withMessage('Maximum hourly rate must be a positive number'),
    (0, express_validator_1.query)('languages').optional().isString().withMessage('Languages must be a comma-separated string'),
    (0, express_validator_1.query)('experienceLevel')
        .optional()
        .isIn(['BEGINNER', 'INTERMEDIATE', 'EXPERIENCED', 'EXPERT'])
        .withMessage('Invalid experience level'),
], validation_1.handleValidationErrors, chauffeur_controller_1.getAvailableChauffeurs);
/**
 * @route POST /api/chauffeurs/auto-assign/:bookingId
 * @desc Auto-assign best available chauffeur to booking
 * @access Private
 */
router.post('/auto-assign/:bookingId', [
    (0, express_validator_1.param)('bookingId').isUUID().withMessage('Valid booking ID is required'),
    (0, express_validator_1.body)('vehicleType').optional().isString().withMessage('Vehicle type must be a string'),
    (0, express_validator_1.body)('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Minimum rating must be between 0 and 5'),
    (0, express_validator_1.body)('maxHourlyRate').optional().isFloat({ min: 0 }).withMessage('Maximum hourly rate must be a positive number'),
    (0, express_validator_1.body)('languages').optional().isArray().withMessage('Languages must be an array'),
], validation_1.handleValidationErrors, chauffeur_controller_1.autoAssignChauffeurToBooking);
/**
 * @route POST /api/chauffeurs/assign/:bookingId/:chauffeurId
 * @desc Manually assign specific chauffeur to booking
 * @access Private
 */
router.post('/assign/:bookingId/:chauffeurId', [
    (0, express_validator_1.param)('bookingId').isUUID().withMessage('Valid booking ID is required'),
    (0, express_validator_1.param)('chauffeurId').isUUID().withMessage('Valid chauffeur ID is required'),
], validation_1.handleValidationErrors, chauffeur_controller_1.assignSpecificChauffeur);
/**
 * @route DELETE /api/chauffeurs/remove/:bookingId
 * @desc Remove chauffeur from booking
 * @access Private
 */
router.delete('/remove/:bookingId', [(0, express_validator_1.param)('bookingId').isUUID().withMessage('Valid booking ID is required')], validation_1.handleValidationErrors, chauffeur_controller_1.removeChauffeurFromBooking);
/**
 * @route GET /api/chauffeurs/:chauffeurId
 * @desc Get detailed chauffeur information
 * @access Private
 */
router.get('/:chauffeurId', [(0, express_validator_1.param)('chauffeurId').isUUID().withMessage('Valid chauffeur ID is required')], validation_1.handleValidationErrors, chauffeur_controller_1.getChauffeurProfile);
/**
 * @route POST /api/chauffeurs
 * @desc Create new chauffeur (Admin only)
 * @access Private (Admin)
 */
router.post('/', [
    (0, express_validator_1.body)('fullName')
        .trim()
        .isLength({ min: 2, max: 150 })
        .withMessage('Full name must be between 2 and 150 characters'),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('phone').isMobilePhone('any').withMessage('Valid phone number is required'),
    (0, express_validator_1.body)('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
    (0, express_validator_1.body)('nationality')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nationality must be between 2 and 100 characters'),
    (0, express_validator_1.body)('licenseNumber')
        .trim()
        .isLength({ min: 5, max: 50 })
        .withMessage('License number must be between 5 and 50 characters'),
    (0, express_validator_1.body)('licenseExpiryDate').isISO8601().withMessage('Valid license expiry date is required'),
    (0, express_validator_1.body)('licenseIssuingCountry')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('License issuing country is required'),
    (0, express_validator_1.body)('experienceLevel')
        .isIn(['BEGINNER', 'INTERMEDIATE', 'EXPERIENCED', 'EXPERT'])
        .withMessage('Invalid experience level'),
    (0, express_validator_1.body)('yearsOfExperience').isInt({ min: 0, max: 50 }).withMessage('Years of experience must be between 0 and 50'),
    (0, express_validator_1.body)('languages').isArray({ min: 1 }).withMessage('At least one language is required'),
    (0, express_validator_1.body)('specializations').isArray({ min: 1 }).withMessage('At least one specialization is required'),
    (0, express_validator_1.body)('hourlyRate').isFloat({ min: 0 }).withMessage('Hourly rate must be a positive number'),
    (0, express_validator_1.body)('emergencyContactName')
        .trim()
        .isLength({ min: 2, max: 150 })
        .withMessage('Emergency contact name is required'),
    (0, express_validator_1.body)('emergencyContactPhone').isMobilePhone('any').withMessage('Valid emergency contact phone is required'),
    (0, express_validator_1.body)('address').trim().isLength({ min: 10, max: 500 }).withMessage('Address must be between 10 and 500 characters'),
    (0, express_validator_1.body)('city').trim().isLength({ min: 2, max: 100 }).withMessage('City is required'),
    (0, express_validator_1.body)('state').trim().isLength({ min: 2, max: 100 }).withMessage('State is required'),
    (0, express_validator_1.body)('zipCode').trim().isLength({ min: 3, max: 20 }).withMessage('Zip code is required'),
    (0, express_validator_1.body)('country').trim().isLength({ min: 2, max: 100 }).withMessage('Country is required'),
], validation_1.handleValidationErrors, chauffeur_controller_1.createNewChauffeur);
/**
 * @route PUT /api/chauffeurs/:chauffeurId
 * @desc Update chauffeur information
 * @access Private
 */
router.put('/:chauffeurId', [
    (0, express_validator_1.param)('chauffeurId').isUUID().withMessage('Valid chauffeur ID is required'),
    (0, express_validator_1.body)('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 150 })
        .withMessage('Full name must be between 2 and 150 characters'),
    (0, express_validator_1.body)('phone').optional().isMobilePhone('any').withMessage('Valid phone number is required'),
    (0, express_validator_1.body)('experienceLevel')
        .optional()
        .isIn(['BEGINNER', 'INTERMEDIATE', 'EXPERIENCED', 'EXPERT'])
        .withMessage('Invalid experience level'),
    (0, express_validator_1.body)('yearsOfExperience')
        .optional()
        .isInt({ min: 0, max: 50 })
        .withMessage('Years of experience must be between 0 and 50'),
    (0, express_validator_1.body)('languages').optional().isArray({ min: 1 }).withMessage('At least one language is required'),
    (0, express_validator_1.body)('specializations').optional().isArray({ min: 1 }).withMessage('At least one specialization is required'),
    (0, express_validator_1.body)('hourlyRate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be a positive number'),
    (0, express_validator_1.body)('status').optional().isIn(['AVAILABLE', 'BUSY', 'OFF_DUTY', 'ON_BREAK']).withMessage('Invalid status'),
], validation_1.handleValidationErrors, chauffeur_controller_1.updateChauffeurProfile);
/**
 * @route GET /api/chauffeurs/:chauffeurId/metrics
 * @desc Get chauffeur performance metrics (Admin only)
 * @access Private (Admin)
 */
router.get('/:chauffeurId/metrics', [(0, express_validator_1.param)('chauffeurId').isUUID().withMessage('Valid chauffeur ID is required')], validation_1.handleValidationErrors, chauffeur_controller_1.getChauffeurPerformance);
/**
 * @route GET /api/chauffeurs
 * @desc Get all chauffeurs (Admin only)
 * @access Private (Admin)
 */
router.get('/', [
    (0, express_validator_1.query)('status').optional().isIn(['AVAILABLE', 'BUSY', 'OFF_DUTY', 'ON_BREAK']).withMessage('Invalid status'),
    (0, express_validator_1.query)('city').optional().isString().withMessage('City must be a string'),
    (0, express_validator_1.query)('experienceLevel')
        .optional()
        .isIn(['BEGINNER', 'INTERMEDIATE', 'EXPERIENCED', 'EXPERT'])
        .withMessage('Invalid experience level'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
], validation_1.handleValidationErrors, chauffeur_controller_1.getAllChauffeurs);
exports.default = router;
//# sourceMappingURL=chauffeur.routes.js.map