"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const vehicle_routes_1 = __importDefault(require("./vehicle.routes"));
const booking_routes_1 = __importDefault(require("./booking.routes"));
const payment_routes_1 = __importDefault(require("./payment.routes"));
const chauffeur_routes_1 = __importDefault(require("./chauffeur.routes"));
const chauffeurAssignment_routes_1 = __importDefault(require("./chauffeurAssignment.routes"));
const location_routes_1 = __importDefault(require("./location.routes"));
const rateLimiter_1 = require("../services/middleware/rateLimiter");
const router = (0, express_1.Router)();
// Apply general rate limiting to all routes
router.use(rateLimiter_1.generalLimiter);
// Mount route modules
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/vehicles', vehicle_routes_1.default);
router.use('/bookings', booking_routes_1.default);
router.use('/payments', payment_routes_1.default);
router.use('/chauffeurs', chauffeur_routes_1.default);
router.use('/chauffeur-assignment', chauffeurAssignment_routes_1.default);
router.use('/locations', location_routes_1.default);
// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is healthy',
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map