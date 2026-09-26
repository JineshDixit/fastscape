"use strict";
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
exports.updateProfile = exports.getProfile = exports.logoutAll = exports.logoutAdmin = exports.refresh = exports.loginAdmin = exports.registerAdmin = void 0;
const auth_service_1 = require("../../services/auth/auth.service");
const adminUser_service_1 = require("../../services/adminUser/adminUser.service");
const response_utils_1 = require("../../utils/response.utils");
const errorHandler_1 = require("../../services/middleware/errorHandler");
/**
 * Register a new admin user
 */
const registerAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstName, lastName, email, password } = req.body;
        const deviceInfo = req.get('User-Agent');
        const ipAddress = req.ip;
        const result = yield (0, auth_service_1.register)({ firstName, lastName, email, password }, deviceInfo, ipAddress);
        (0, response_utils_1.sendCreated)(res, 'Admin user registered successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.registerAdmin = registerAdmin;
/**
 * Login admin user
 */
const loginAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const deviceInfo = req.get('User-Agent');
        const ipAddress = req.ip;
        const result = yield (0, auth_service_1.login)({ email, password }, deviceInfo, ipAddress);
        (0, response_utils_1.sendSuccess)(res, 'Login successful', result);
    }
    catch (error) {
        next(error);
    }
});
exports.loginAdmin = loginAdmin;
/**
 * Refresh access token
 */
const refresh = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken: token } = req.body;
        if (!token) {
            throw (0, errorHandler_1.createError)('Refresh token is required', 400);
        }
        const result = yield (0, auth_service_1.refreshToken)(token);
        (0, response_utils_1.sendSuccess)(res, 'Token refreshed successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.refresh = refresh;
/**
 * Logout admin user
 */
const logoutAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw (0, errorHandler_1.createError)('Refresh token is required', 400);
        }
        yield (0, auth_service_1.logout)(refreshToken);
        (0, response_utils_1.sendSuccess)(res, 'Logout successful');
    }
    catch (error) {
        next(error);
    }
});
exports.logoutAdmin = logoutAdmin;
/**
 * Logout from all devices
 */
const logoutAll = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const adminUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!adminUserId) {
            throw (0, errorHandler_1.createError)('Admin user ID not found', 401);
        }
        yield (0, auth_service_1.logoutFromAllDevices)(adminUserId);
        (0, response_utils_1.sendSuccess)(res, 'Logged out from all devices successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.logoutAll = logoutAll;
/**
 * Get admin user profile
 */
const getProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const adminUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!adminUserId) {
            throw (0, errorHandler_1.createError)('Admin user ID not found', 401);
        }
        const result = yield (0, auth_service_1.getCurrentProfile)(adminUserId);
        (0, response_utils_1.sendSuccess)(res, 'Profile retrieved successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.getProfile = getProfile;
/**
 * Update current admin user's profile
 */
const updateProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const adminUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!adminUserId) {
            throw (0, errorHandler_1.createError)('Admin user ID not found', 401);
        }
        const { firstName, lastName, email } = req.body;
        const result = yield (0, adminUser_service_1.update)(adminUserId, {
            firstName,
            lastName,
            email,
        });
        (0, response_utils_1.sendSuccess)(res, 'Profile updated successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.updateProfile = updateProfile;
//# sourceMappingURL=auth.controller.js.map