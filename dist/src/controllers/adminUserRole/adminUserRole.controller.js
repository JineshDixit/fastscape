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
exports.removeAllRolesFromUser = exports.bulkAssignRolesToUser = exports.checkUserHasAnyPermission = exports.checkUserHasPermission = exports.checkUserHasAnyRole = exports.checkUserHasRole = exports.getAdminUserPermissions = exports.getRoleAdminUsers = exports.getAdminUserRoles = exports.removeRoleFromUser = exports.assignRoleToUser = void 0;
const adminUserRole_service_1 = require("../../services/adminUserRole/adminUserRole.service");
const response_utils_1 = require("../../utils/response.utils");
const errorHandler_1 = require("../../services/middleware/errorHandler");
/**
 * Assign role to admin user
 */
const assignRoleToUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { adminUserId, roleId } = req.body;
        const assignedBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // Get from authenticated user
        if (!adminUserId || !roleId) {
            throw (0, errorHandler_1.createError)('Admin User ID and Role ID are required', 400);
        }
        const result = yield (0, adminUserRole_service_1.assignRole)({ adminUserId, roleId }, assignedBy);
        (0, response_utils_1.sendCreated)(res, 'Role assigned to admin user successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.assignRoleToUser = assignRoleToUser;
/**
 * Remove role from admin user
 */
const removeRoleFromUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adminUserId, roleId } = req.body;
        if (!adminUserId || !roleId) {
            throw (0, errorHandler_1.createError)('Admin User ID and Role ID are required', 400);
        }
        const result = yield (0, adminUserRole_service_1.removeRole)(adminUserId, roleId);
        (0, response_utils_1.sendSuccess)(res, 'Role removed from admin user successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.removeRoleFromUser = removeRoleFromUser;
/**
 * Get all roles assigned to an admin user
 */
const getAdminUserRoles = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adminUserId } = req.params;
        const result = yield (0, adminUserRole_service_1.getUserRoles)(adminUserId);
        (0, response_utils_1.sendSuccess)(res, 'Admin user roles retrieved successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.getAdminUserRoles = getAdminUserRoles;
/**
 * Get all admin users assigned to a role
 */
const getRoleAdminUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roleId } = req.params;
        const result = yield (0, adminUserRole_service_1.getRoleUsers)(roleId);
        (0, response_utils_1.sendSuccess)(res, 'Role admin users retrieved successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.getRoleAdminUsers = getRoleAdminUsers;
/**
 * Get admin user permissions
 */
const getAdminUserPermissions = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adminUserId } = req.params;
        const result = yield (0, adminUserRole_service_1.getUserPermissions)(adminUserId);
        (0, response_utils_1.sendSuccess)(res, 'Admin user permissions retrieved successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.getAdminUserPermissions = getAdminUserPermissions;
/**
 * Check if admin user has specific role
 */
const checkUserHasRole = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adminUserId, roleId } = req.params;
        const result = yield (0, adminUserRole_service_1.hasRole)(adminUserId, roleId);
        (0, response_utils_1.sendSuccess)(res, 'Role check completed', { hasRole: result });
    }
    catch (error) {
        next(error);
    }
});
exports.checkUserHasRole = checkUserHasRole;
/**
 * Check if admin user has any of the specified roles
 */
const checkUserHasAnyRole = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adminUserId } = req.params;
        const { roleIds } = req.body;
        if (!Array.isArray(roleIds) || roleIds.length === 0) {
            throw (0, errorHandler_1.createError)('Role IDs array is required', 400);
        }
        const result = yield (0, adminUserRole_service_1.hasAnyRole)(adminUserId, roleIds);
        (0, response_utils_1.sendSuccess)(res, 'Role check completed', { hasAnyRole: result });
    }
    catch (error) {
        next(error);
    }
});
exports.checkUserHasAnyRole = checkUserHasAnyRole;
/**
 * Check if admin user has specific permission
 */
const checkUserHasPermission = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adminUserId, permission } = req.params;
        if (!permission) {
            throw (0, errorHandler_1.createError)('Permission is required', 400);
        }
        const result = yield (0, adminUserRole_service_1.hasPermission)(adminUserId, permission);
        (0, response_utils_1.sendSuccess)(res, 'Permission check completed', { hasPermission: result });
    }
    catch (error) {
        next(error);
    }
});
exports.checkUserHasPermission = checkUserHasPermission;
/**
 * Check if admin user has any of the specified permissions
 */
const checkUserHasAnyPermission = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adminUserId } = req.params;
        const { permissions } = req.body;
        if (!Array.isArray(permissions) || permissions.length === 0) {
            throw (0, errorHandler_1.createError)('Permissions array is required', 400);
        }
        const result = yield (0, adminUserRole_service_1.hasAnyPermission)(adminUserId, permissions);
        (0, response_utils_1.sendSuccess)(res, 'Permission check completed', { hasAnyPermission: result });
    }
    catch (error) {
        next(error);
    }
});
exports.checkUserHasAnyPermission = checkUserHasAnyPermission;
/**
 * Bulk assign roles to admin user
 */
const bulkAssignRolesToUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { adminUserId } = req.params;
        const { roleIds } = req.body;
        const assignedBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // Get from authenticated user
        if (!Array.isArray(roleIds) || roleIds.length === 0) {
            throw (0, errorHandler_1.createError)('Role IDs array is required', 400);
        }
        const result = yield (0, adminUserRole_service_1.bulkAssignRoles)(adminUserId, roleIds, assignedBy);
        (0, response_utils_1.sendSuccess)(res, 'Roles assigned to admin user successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.bulkAssignRolesToUser = bulkAssignRolesToUser;
/**
 * Remove all roles from admin user
 */
const removeAllRolesFromUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adminUserId } = req.params;
        const result = yield (0, adminUserRole_service_1.removeAllRoles)(adminUserId);
        (0, response_utils_1.sendSuccess)(res, 'All roles removed from admin user successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.removeAllRolesFromUser = removeAllRolesFromUser;
//# sourceMappingURL=adminUserRole.controller.js.map