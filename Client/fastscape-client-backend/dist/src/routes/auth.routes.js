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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController = __importStar(require("../controller/auth/auth.controller"));
const authenticateUser_1 = require("../services/middleware/authenticateUser");
const rateLimiter_1 = require("../services/middleware/rateLimiter");
const validation_1 = require("../services/middleware/validation");
const router = (0, express_1.Router)();
// Public routes with rate limiting and validation
router.post('/register', rateLimiter_1.authLimiter, validation_1.validateRegistration, authController.register);
router.post('/login', rateLimiter_1.authLimiter, validation_1.validateLogin, authController.login);
router.post('/refresh-token', rateLimiter_1.refreshTokenLimiter, validation_1.validateRefreshToken, authController.refreshToken);
router.post('/logout', validation_1.validateRefreshToken, authController.logout);
router.post('/forgot-password', rateLimiter_1.authLimiter, validation_1.validateForgotPassword, authController.forgotPassword);
router.post('/verify-otp', rateLimiter_1.authLimiter, validation_1.validateVerifyOtp, authController.verifyOtp);
router.post('/reset-password', rateLimiter_1.authLimiter, validation_1.validateResetPassword, authController.resetPassword);
// Protected routes
router.post('/logout-all', authenticateUser_1.authenticateUser, authController.logoutAllDevices);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map