"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const adminUser_routes_1 = __importDefault(require("./adminUser.routes"));
const role_routes_1 = __importDefault(require("./role.routes"));
const policy_routes_1 = __importDefault(require("./policy.routes"));
const rolePolicy_routes_1 = __importDefault(require("./rolePolicy.routes"));
const adminUserRole_routes_1 = __importDefault(require("./adminUserRole.routes"));
const vehicle_routes_1 = __importDefault(require("./vehicle.routes"));
const booking_routes_1 = __importDefault(require("./booking.routes"));
const payment_routes_1 = __importDefault(require("./payment.routes"));
const document_routes_1 = __importDefault(require("./document.routes"));
const chauffeur_routes_1 = __importDefault(require("./chauffeur.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const location_routes_1 = __importDefault(require("./location.routes"));
const finance_routes_1 = __importDefault(require("./finance.routes"));
const dashboard_routes_1 = __importDefault(require("./dashboard.routes"));
const router = (0, express_1.Router)();
// Mount route modules
router.use('/auth', auth_routes_1.default);
router.use('/admin-users', adminUser_routes_1.default);
router.use('/roles', role_routes_1.default);
router.use('/policies', policy_routes_1.default);
router.use('/role-policies', rolePolicy_routes_1.default);
router.use('/admin-user-roles', adminUserRole_routes_1.default);
router.use('/vehicles', vehicle_routes_1.default);
router.use('/bookings', booking_routes_1.default);
router.use('/payments', payment_routes_1.default);
router.use('/documents', document_routes_1.default);
router.use('/chauffeurs', chauffeur_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/locations', location_routes_1.default);
router.use('/finance', finance_routes_1.default);
router.use('/dashboard', dashboard_routes_1.default);
// API info endpoint
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Fastscape Admin API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            adminUsers: '/api/admin-users',
            roles: '/api/roles',
            vehicles: '/api/vehicles',
            bookings: '/api/bookings',
            payments: '/api/payments',
            documents: '/api/documents',
            chauffeurs: '/api/chauffeurs',
            users: '/api/users',
            locations: '/api/locations',
            finance: '/api/finance',
            dashboard: '/api/dashboard',
            policies: '/api/policies',
            rolePolicies: '/api/role-policies',
            adminUserRoles: '/api/admin-user-roles',
        },
        documentation: 'API documentation available at /api/docs',
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map