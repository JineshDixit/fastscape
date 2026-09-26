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
exports.isActive = exports.exists = exports.getByRole = exports.remove = exports.deactivate = exports.activate = exports.changePassword = exports.updatePassword = exports.update = exports.updateLanguage = exports.getAll = exports.getByEmail = exports.getById = exports.create = void 0;
const models_1 = require("../../models");
const password_utils_1 = require("../../utils/password.utils");
const security_utils_1 = require("../../utils/security.utils");
const adminUser_utils_1 = require("../../utils/adminUser.utils");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_utils_1 = require("../../utils/validation.utils");
const sequelize_1 = require("sequelize");
const constants_1 = require("../../common/constants/constants");
// Supported languages constant
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'ar'];
/**
 * Validate language
 */
const validateLanguage = (language) => {
    if (!SUPPORTED_LANGUAGES.includes(language)) {
        throw (0, errorHandler_1.createError)(`Unsupported language. Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`, 400);
    }
};
/**
 * Get admin user by ID or throw error
 */
const getAdminUserOrThrow = (adminUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield models_1.AdminUser.findByPk(adminUserId);
    if (!user) {
        throw (0, errorHandler_1.createError)('Admin user not found', 404);
    }
    return user;
});
/**
 * Create new admin user
 */
const create = (userData) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, email: rawEmail, password } = userData;
    // Validate required fields
    (0, validation_utils_1.validateRequiredFields)(userData, ['firstName', 'lastName', 'email', 'password']);
    const email = (0, security_utils_1.sanitizeEmail)(rawEmail);
    (0, validation_utils_1.validateEmail)(email);
    // Check if admin user already exists
    const existingUser = yield models_1.AdminUser.findOne({ where: { email } });
    if (existingUser) {
        throw (0, errorHandler_1.createError)('Admin user with this email already exists', 409);
    }
    // Hash password
    const passwordHash = yield (0, password_utils_1.hashPassword)(password);
    // Create admin user
    const user = yield models_1.AdminUser.create({
        firstName,
        lastName,
        email,
        passwordHash,
        isActive: true,
    });
    return (0, adminUser_utils_1.formatAdminUserResponse)(user);
});
exports.create = create;
/**
 * Get admin user by ID
 */
const getById = (adminUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield (0, adminUser_utils_1.getAdminUserWithRolesAndPermissions)(adminUserId);
    if (!user) {
        throw (0, errorHandler_1.createError)('Admin user not found', 404);
    }
    return (0, adminUser_utils_1.formatAdminUserResponse)(user);
});
exports.getById = getById;
/**
 * Get admin user by email
 */
const getByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const sanitizedEmail = (0, security_utils_1.sanitizeEmail)(email);
    (0, validation_utils_1.validateEmail)(sanitizedEmail);
    const user = yield models_1.AdminUser.findOne({
        where: { email: sanitizedEmail },
        include: constants_1.ADMIN_USER_ROLES_POLICIES_INCLUDE,
    });
    if (!user) {
        throw (0, errorHandler_1.createError)('Admin user not found', 404);
    }
    return (0, adminUser_utils_1.formatAdminUserResponse)(user);
});
exports.getByEmail = getByEmail;
/**
 * Get all admin users with pagination
 */
const getAll = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 20, search, isActive) {
    const offset = (page - 1) * limit;
    const whereClause = {};
    if (search) {
        whereClause[sequelize_1.Op.or] = [
            { firstName: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { lastName: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { email: { [sequelize_1.Op.iLike]: `%${search}%` } },
        ];
    }
    if (isActive !== undefined) {
        whereClause.isActive = isActive;
    }
    const { rows: users, count: total } = yield models_1.AdminUser.findAndCountAll({
        where: whereClause,
        include: constants_1.ADMIN_USER_ROLES_POLICIES_INCLUDE,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });
    return {
        users: users.map(adminUser_utils_1.formatAdminUserResponse),
        total,
        totalPages: Math.ceil(total / limit),
    };
});
exports.getAll = getAll;
/**
 * Update admin user language preference
 */
const updateLanguage = (adminUserId, language) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield getAdminUserOrThrow(adminUserId);
    // Validate language
    validateLanguage(language);
    // Update language
    yield user.update({ preferredLanguage: language });
    // Get updated user with roles
    const updatedUser = yield (0, adminUser_utils_1.getAdminUserWithRolesAndPermissions)(adminUserId);
    return (0, adminUser_utils_1.formatAdminUserResponse)(updatedUser);
});
exports.updateLanguage = updateLanguage;
/**
 * Update admin user
 */
const update = (adminUserId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield getAdminUserOrThrow(adminUserId);
    // If email is being updated, validate and check for duplicates
    if (updateData.email) {
        const sanitizedEmail = (0, security_utils_1.sanitizeEmail)(updateData.email);
        (0, validation_utils_1.validateEmail)(sanitizedEmail);
        const existingUser = yield models_1.AdminUser.findOne({
            where: {
                email: sanitizedEmail,
                id: { [sequelize_1.Op.ne]: adminUserId },
            },
        });
        if (existingUser) {
            throw (0, errorHandler_1.createError)('Admin user with this email already exists', 409);
        }
        updateData.email = sanitizedEmail;
    }
    // If language is being updated, validate it
    if (updateData.preferredLanguage) {
        validateLanguage(updateData.preferredLanguage);
    }
    // Update user
    yield user.update(updateData);
    // Get updated user with roles
    const updatedUser = yield (0, adminUser_utils_1.getAdminUserWithRolesAndPermissions)(adminUserId);
    return (0, adminUser_utils_1.formatAdminUserResponse)(updatedUser);
});
exports.update = update;
/**
 * Helper: Update user password (internal use)
 */
const updateUserPassword = (user, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const passwordHash = yield (0, password_utils_1.hashPassword)(newPassword);
    yield user.update({ passwordHash });
});
/**
 * Update admin user password (admin action - no current password verification)
 * Used by super-admin to reset any user's password
 */
const updatePassword = (adminUserId, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield getAdminUserOrThrow(adminUserId);
    yield updateUserPassword(user, newPassword);
});
exports.updatePassword = updatePassword;
/**
 * Change admin user password (user action - requires current password verification)
 * Used by user to change their own password
 */
const changePassword = (adminUserId, currentPassword, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield getAdminUserOrThrow(adminUserId);
    // Verify current password
    const isPasswordValid = yield (0, password_utils_1.comparePassword)(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
        throw (0, errorHandler_1.createError)('Current password is incorrect', 401);
    }
    yield updateUserPassword(user, newPassword);
});
exports.changePassword = changePassword;
/**
 * Activate admin user
 */
const activate = (adminUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield getAdminUserOrThrow(adminUserId);
    yield user.update({ isActive: true });
    const updatedUser = yield (0, adminUser_utils_1.getAdminUserWithRolesAndPermissions)(adminUserId);
    return (0, adminUser_utils_1.formatAdminUserResponse)(updatedUser);
});
exports.activate = activate;
/**
 * Deactivate admin user
 */
const deactivate = (adminUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield getAdminUserOrThrow(adminUserId);
    yield user.update({ isActive: false });
    const updatedUser = yield (0, adminUser_utils_1.getAdminUserWithRolesAndPermissions)(adminUserId);
    return (0, adminUser_utils_1.formatAdminUserResponse)(updatedUser);
});
exports.deactivate = deactivate;
/**
 * Delete admin user (soft delete by deactivating)
 */
const remove = (adminUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield getAdminUserOrThrow(adminUserId);
    // Soft delete by deactivating
    yield user.update({ isActive: false });
});
exports.remove = remove;
/**
 * Get admin users by role
 */
const getByRole = (roleId) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield models_1.AdminUser.findAll({
        include: constants_1.ADMIN_USER_ROLES_POLICIES_INCLUDE,
        where: { isActive: true },
    });
    return users.map(adminUser_utils_1.formatAdminUserResponse);
});
exports.getByRole = getByRole;
/**
 * Check if admin user exists
 */
const exists = (adminUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield models_1.AdminUser.findByPk(adminUserId);
    return !!user;
});
exports.exists = exists;
/**
 * Check if admin user is active
 */
const isActive = (adminUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield models_1.AdminUser.findByPk(adminUserId);
    return (user === null || user === void 0 ? void 0 : user.isActive) || false;
});
exports.isActive = isActive;
//# sourceMappingURL=adminUser.service.js.map