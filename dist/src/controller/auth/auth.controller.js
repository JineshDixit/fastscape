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
exports.resetPassword = exports.verifyOtp = exports.forgotPassword = exports.logoutAllDevices = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const authService = __importStar(require("../../services/auth/auth.service"));
const controller_utils_1 = require("../../utils/controller.utils");
const response_utils_1 = require("../../utils/response.utils");
const errorHandler_1 = require("../../services/middleware/errorHandler");
class AuthController extends controller_utils_1.BaseController {
    constructor() {
        super(...arguments);
        /**
         * Register a new user
         */
        this.register = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const registerData = req.body;
            const result = yield authService.registerUser(registerData);
            (0, response_utils_1.sendCreated)(res, 'User registered successfully', result);
        }));
        /**
         * Login user
         */
        this.login = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const loginData = req.body;
            const result = yield authService.loginUser(loginData);
            (0, response_utils_1.sendSuccess)(res, 'Login successful', result);
        }));
        /**
         * Refresh access token
         */
        this.refreshToken = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { refreshToken } = req.body;
            const result = yield authService.refreshAccessToken(refreshToken);
            (0, response_utils_1.sendSuccess)(res, 'Tokens refreshed successfully', result);
        }));
        /**
         * Logout user (revoke refresh token)
         */
        this.logout = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { refreshToken } = req.body;
            yield authService.logoutUser(refreshToken);
            (0, response_utils_1.sendSuccess)(res, 'Logout successful');
        }));
        /**
         * Logout from all devices (revoke all refresh tokens for user)
         */
        this.logoutAllDevices = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = this.ensureAuthenticated(req);
            yield authService.logoutAllDevices(userId);
            (0, response_utils_1.sendSuccess)(res, 'Logged out from all devices successfully');
        }));
        /**
         * Initiate forgot password flow
         */
        this.forgotPassword = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            yield authService.forgotPassword(req.body.email);
            (0, response_utils_1.sendSuccess)(res, 'If the email exists, an OTP has been sent to it.');
        }));
        /**
         * Verify OTP
         */
        this.verifyOtp = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const isValid = yield authService.verifyOtp(req.body.email, req.body.otp);
            if (!isValid) {
                throw (0, errorHandler_1.createError)('Invalid or expired OTP', 400);
            }
            (0, response_utils_1.sendSuccess)(res, 'OTP verified successfully');
        }));
        /**
         * Reset password
         */
        this.resetPassword = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            yield authService.resetPassword(req.body.email, req.body.otp, req.body.newPassword);
            (0, response_utils_1.sendSuccess)(res, 'Password has been reset successfully');
        }));
    }
}
const authController = new AuthController();
exports.register = authController.register, exports.login = authController.login, exports.refreshToken = authController.refreshToken, exports.logout = authController.logout, exports.logoutAllDevices = authController.logoutAllDevices, exports.forgotPassword = authController.forgotPassword, exports.verifyOtp = authController.verifyOtp, exports.resetPassword = authController.resetPassword;
//# sourceMappingURL=auth.controller.js.map