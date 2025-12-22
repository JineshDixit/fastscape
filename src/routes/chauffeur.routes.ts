import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getAvailableChauffeurs,
  autoAssignChauffeurToBooking,
  assignSpecificChauffeur,
  removeChauffeurFromBooking,
  getChauffeurProfile,
  createNewChauffeur,
  updateChauffeurProfile,
  getChauffeurPerformance,
  getAllChauffeurs,
} from '../controller/chauffeur/chauffeur.controller';
import { authenticateUser } from '../services/middleware/authenticateUser';
import { handleValidationErrors } from '../services/middleware/validation';

const router = Router();

// Apply authentication to all chauffeur routes
router.use(authenticateUser);

/**
 * @route GET /api/chauffeurs/available
 * @desc Get available chauffeurs for a time period
 * @access Private
 */
router.get(
  '/available',
  [
    query('startDatetime')
      .isISO8601()
      .withMessage('Valid start datetime is required'),
    query('endDatetime')
      .isISO8601()
      .withMessage('Valid end datetime is required'),
    query('vehicleType')
      .optional()
      .isString()
      .withMessage('Vehicle type must be a string'),
    query('city')
      .optional()
      .isString()
      .withMessage('City must be a string'),
    query('minRating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('Minimum rating must be between 0 and 5'),
    query('maxHourlyRate')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum hourly rate must be a positive number'),
    query('languages')
      .optional()
      .isString()
      .withMessage('Languages must be a comma-separated string'),
    query('experienceLevel')
      .optional()
      .isIn(['BEGINNER', 'INTERMEDIATE', 'EXPERIENCED', 'EXPERT'])
      .withMessage('Invalid experience level'),
  ],
  handleValidationErrors,
  getAvailableChauffeurs,
);

/**
 * @route POST /api/chauffeurs/auto-assign/:bookingId
 * @desc Auto-assign best available chauffeur to booking
 * @access Private
 */
router.post(
  '/auto-assign/:bookingId',
  [
    param('bookingId')
      .isUUID()
      .withMessage('Valid booking ID is required'),
    body('vehicleType')
      .optional()
      .isString()
      .withMessage('Vehicle type must be a string'),
    body('minRating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('Minimum rating must be between 0 and 5'),
    body('maxHourlyRate')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum hourly rate must be a positive number'),
    body('languages')
      .optional()
      .isArray()
      .withMessage('Languages must be an array'),
  ],
  handleValidationErrors,
  autoAssignChauffeurToBooking,
);

/**
 * @route POST /api/chauffeurs/assign/:bookingId/:chauffeurId
 * @desc Manually assign specific chauffeur to booking
 * @access Private
 */
router.post(
  '/assign/:bookingId/:chauffeurId',
  [
    param('bookingId')
      .isUUID()
      .withMessage('Valid booking ID is required'),
    param('chauffeurId')
      .isUUID()
      .withMessage('Valid chauffeur ID is required'),
  ],
  handleValidationErrors,
  assignSpecificChauffeur,
);

/**
 * @route DELETE /api/chauffeurs/remove/:bookingId
 * @desc Remove chauffeur from booking
 * @access Private
 */
router.delete(
  '/remove/:bookingId',
  [
    param('bookingId')
      .isUUID()
      .withMessage('Valid booking ID is required'),
  ],
  handleValidationErrors,
  removeChauffeurFromBooking,
);

/**
 * @route GET /api/chauffeurs/:chauffeurId
 * @desc Get detailed chauffeur information
 * @access Private
 */
router.get(
  '/:chauffeurId',
  [
    param('chauffeurId')
      .isUUID()
      .withMessage('Valid chauffeur ID is required'),
  ],
  handleValidationErrors,
  getChauffeurProfile,
);

/**
 * @route POST /api/chauffeurs
 * @desc Create new chauffeur (Admin only)
 * @access Private (Admin)
 */
router.post(
  '/',
  [
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 150 })
      .withMessage('Full name must be between 2 and 150 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('phone')
      .isMobilePhone('any')
      .withMessage('Valid phone number is required'),
    body('dateOfBirth')
      .isISO8601()
      .withMessage('Valid date of birth is required'),
    body('nationality')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nationality must be between 2 and 100 characters'),
    body('licenseNumber')
      .trim()
      .isLength({ min: 5, max: 50 })
      .withMessage('License number must be between 5 and 50 characters'),
    body('licenseExpiryDate')
      .isISO8601()
      .withMessage('Valid license expiry date is required'),
    body('licenseIssuingCountry')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('License issuing country is required'),
    body('experienceLevel')
      .isIn(['BEGINNER', 'INTERMEDIATE', 'EXPERIENCED', 'EXPERT'])
      .withMessage('Invalid experience level'),
    body('yearsOfExperience')
      .isInt({ min: 0, max: 50 })
      .withMessage('Years of experience must be between 0 and 50'),
    body('languages')
      .isArray({ min: 1 })
      .withMessage('At least one language is required'),
    body('specializations')
      .isArray({ min: 1 })
      .withMessage('At least one specialization is required'),
    body('hourlyRate')
      .isFloat({ min: 0 })
      .withMessage('Hourly rate must be a positive number'),
    body('emergencyContactName')
      .trim()
      .isLength({ min: 2, max: 150 })
      .withMessage('Emergency contact name is required'),
    body('emergencyContactPhone')
      .isMobilePhone('any')
      .withMessage('Valid emergency contact phone is required'),
    body('address')
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Address must be between 10 and 500 characters'),
    body('city')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('City is required'),
    body('state')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('State is required'),
    body('zipCode')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Zip code is required'),
    body('country')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Country is required'),
  ],
  handleValidationErrors,
  createNewChauffeur,
);

/**
 * @route PUT /api/chauffeurs/:chauffeurId
 * @desc Update chauffeur information
 * @access Private
 */
router.put(
  '/:chauffeurId',
  [
    param('chauffeurId')
      .isUUID()
      .withMessage('Valid chauffeur ID is required'),
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 150 })
      .withMessage('Full name must be between 2 and 150 characters'),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Valid phone number is required'),
    body('experienceLevel')
      .optional()
      .isIn(['BEGINNER', 'INTERMEDIATE', 'EXPERIENCED', 'EXPERT'])
      .withMessage('Invalid experience level'),
    body('yearsOfExperience')
      .optional()
      .isInt({ min: 0, max: 50 })
      .withMessage('Years of experience must be between 0 and 50'),
    body('languages')
      .optional()
      .isArray({ min: 1 })
      .withMessage('At least one language is required'),
    body('specializations')
      .optional()
      .isArray({ min: 1 })
      .withMessage('At least one specialization is required'),
    body('hourlyRate')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Hourly rate must be a positive number'),
    body('status')
      .optional()
      .isIn(['AVAILABLE', 'BUSY', 'OFF_DUTY', 'ON_BREAK'])
      .withMessage('Invalid status'),
  ],
  handleValidationErrors,
  updateChauffeurProfile,
);

/**
 * @route GET /api/chauffeurs/:chauffeurId/metrics
 * @desc Get chauffeur performance metrics (Admin only)
 * @access Private (Admin)
 */
router.get(
  '/:chauffeurId/metrics',
  [
    param('chauffeurId')
      .isUUID()
      .withMessage('Valid chauffeur ID is required'),
  ],
  handleValidationErrors,
  getChauffeurPerformance,
);

/**
 * @route GET /api/chauffeurs
 * @desc Get all chauffeurs (Admin only)
 * @access Private (Admin)
 */
router.get(
  '/',
  [
    query('status')
      .optional()
      .isIn(['AVAILABLE', 'BUSY', 'OFF_DUTY', 'ON_BREAK'])
      .withMessage('Invalid status'),
    query('city')
      .optional()
      .isString()
      .withMessage('City must be a string'),
    query('experienceLevel')
      .optional()
      .isIn(['BEGINNER', 'INTERMEDIATE', 'EXPERIENCED', 'EXPERT'])
      .withMessage('Invalid experience level'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],
  handleValidationErrors,
  getAllChauffeurs,
);

export default router;