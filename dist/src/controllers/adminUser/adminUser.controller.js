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
exports.deleteAdminUser = exports.deactivateAdminUser = exports.activateAdminUser = exports.updateAdminUserLanguage = exports.changeAdminUserPassword = exports.updateAdminUserPassword = exports.updateAdminUser = exports.getAllAdminUsers = exports.getAdminUserById = exports.createAdminUser = void 0;
const adminUser_service_1 = require("../../services/adminUser/adminUser.service");
const response_utils_1 = require("../../utils/response.utils");
const errorHandler_1 = require("../../services/middleware/errorHandler");
/**
 * Create a new admin user
 */
const createAdminUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstName, lastName, email, password } = req.body;
        const result = yield (0, adminUser_service_1.create)({ firstName, lastName, email, password });
        (0, response_utils_1.sendCreated)(res, 'Admin user created successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.createAdminUser = createAdminUser;
/**
 * Get admin user by ID
 */
const getAdminUserById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, adminUser_service_1.getById)(id);
        (0, response_utils_1.sendSuccess)(res, 'Admin user retrieved successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.getAdminUserById = getAdminUserById;
/**
 * Get all admin users with pagination
 */
const getAllAdminUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page, limit } = (0, response_utils_1.parsePaginationParams)(req.query);
        const { search, isActive } = req.query;
        const activeFilter = isActive !== undefined ? isActive === 'true' : undefined;
        const result = yield (0, adminUser_service_1.getAll)(page, limit, search, activeFilter);
        const pagination = (0, response_utils_1.calculatePagination)(result.total, page, limit);
        (0, response_utils_1.sendSuccessWithPagination)(res, 'Admin users retrieved successfully', result.users, pagination);
    }
    catch (error) {
        next(error);
    }
});
exports.getAllAdminUsers = getAllAdminUsers;
/**
 * Update admin user
 */
const updateAdminUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, isActive } = req.body;
        const result = yield (0, adminUser_service_1.update)(id, {
            firstName,
            lastName,
            email,
            isActive,
        });
        (0, response_utils_1.sendSuccess)(res, 'Admin user updated successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.updateAdminUser = updateAdminUser;
/**
 * Update admin user password
 */
const updateAdminUserPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        if (!newPassword) {
            throw (0, errorHandler_1.createError)('New password is required', 400);
        }
        yield (0, adminUser_service_1.updatePassword)(id, newPassword);
        (0, response_utils_1.sendSuccess)(res, 'Password updated successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.updateAdminUserPassword = updateAdminUserPassword;
/**
 * Change current admin user's password (with current password verification)
 */
const changeAdminUserPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const adminUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!adminUserId) {
            throw (0, errorHandler_1.createError)('Admin user ID not found', 401);
        }
        const { currentPassword, newPassword, confirmPassword } = req.body;
        if (!currentPassword || !newPassword || !confirmPassword) {
            throw (0, errorHandler_1.createError)('Current password, new password, and confirm password are required', 400);
        }
        if (newPassword !== confirmPassword) {
            throw (0, errorHandler_1.createError)('New password and confirm password do not match', 400);
        }
        if (newPassword.length < 6) {
            throw (0, errorHandler_1.createError)('New password must be at least 6 characters long', 400);
        }
        yield (0, adminUser_service_1.changePassword)(adminUserId, currentPassword, newPassword);
        (0, response_utils_1.sendSuccess)(res, 'Password changed successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.changeAdminUserPassword = changeAdminUserPassword;
/**
 * Update admin user language preference
 */
const updateAdminUserLanguage = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const adminUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!adminUserId) {
            throw (0, errorHandler_1.createError)('Admin user ID not found', 401);
        }
        const { language } = req.body;
        if (!language) {
            throw (0, errorHandler_1.createError)('Language is required', 400);
        }
        const result = yield (0, adminUser_service_1.updateLanguage)(adminUserId, language);
        (0, response_utils_1.sendSuccess)(res, 'Language preference updated successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.updateAdminUserLanguage = updateAdminUserLanguage;
/**
 * Activate admin user
 */
const activateAdminUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, adminUser_service_1.activate)(id);
        (0, response_utils_1.sendSuccess)(res, 'Admin user activated successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.activateAdminUser = activateAdminUser;
/**
 * Deactivate admin user
 */
const deactivateAdminUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, adminUser_service_1.deactivate)(id);
        (0, response_utils_1.sendSuccess)(res, 'Admin user deactivated successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.deactivateAdminUser = deactivateAdminUser;
/**
 * Delete admin user
 */
const deleteAdminUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield (0, adminUser_service_1.remove)(id);
        (0, response_utils_1.sendSuccess)(res, 'Admin user deleted successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.deleteAdminUser = deleteAdminUser;
//# sourceMappingURL=adminUser.controller.js.map