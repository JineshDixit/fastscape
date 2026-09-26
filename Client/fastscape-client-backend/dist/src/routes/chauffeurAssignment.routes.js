"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const chauffeurAssignment_controller_1 = require("../controller/booking/chauffeurAssignment.controller");
const authenticateUser_1 = require("../services/middleware/authenticateUser");
const validation_1 = require("../services/middleware/validation");
const router = (0, express_1.Router)();
// Apply authentication to all chauffeur assignment routes
router.use(authenticateUser_1.authenticateUser);
/**
 * @route GET /api/chauffeur-assignment/:bookingId/status
 * @desc Check chauffeur assignment status for a booking
 * @access Private
 */
router.get('/:bookingId/status', [(0, express_validator_1.param)('bookingId').isUUID().withMessage('Valid booking ID is required')], validation_1.handleValidationErrors, chauffeurAssignment_controller_1.checkAssignmentStatus);
exports.default = router;
//# sourceMappingURL=chauffeurAssignment.routes.js.map