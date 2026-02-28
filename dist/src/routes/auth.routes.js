"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth/auth.controller");
const middleware_1 = require("../services/middleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/auth/register
 * @desc    Register a new admin user
 * @access  Public (but should be restricted in production)
 */
router.post('/register', middleware_1.authLimiter, auth_controller_1.registerAdmin);
/**
 * @route   POST /api/auth/login
 * @desc    Login admin user
 * @access  Public
 */
router.post('/login', middleware_1.authLimiter, auth_controller_1.loginAdmin);
/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', middleware_1.refreshTokenLimiter, auth_controller_1.refresh);
/**
 * @route   POST /api/auth/logout
 * @desc    Logout admin user
 * @access  Private
 */
router.post('/logout', middleware_1.authenticateUser, middleware_1.requireActiveUser, auth_controller_1.logoutAdmin);
/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post('/logout-all', middleware_1.authenticateUser, middleware_1.requireActiveUser, auth_controller_1.logoutAll);
/**
 * @route   GET /api/auth/profile
 * @desc    Get admin user profile
 * @access  Private
 */
router.get('/profile', middleware_1.authenticateUser, middleware_1.requireActiveUser, auth_controller_1.getProfile);
/**
 * @route   PUT /api/auth/profile
 * @desc    Update admin user profile
 * @access  Private
 */
router.put('/profile', middleware_1.authenticateUser, middleware_1.requireActiveUser, auth_controller_1.updateProfile);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map