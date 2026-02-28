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
exports.removeAllRoles = exports.bulkAssignRoles = exports.hasAnyPermission = exports.hasPermission = exports.hasAnyRole = exports.hasRole = exports.getUserPermissions = exports.getRoleUsers = exports.getUserRoles = exports.removeRole = exports.assignRole = void 0;
const models_1 = require("../../models");
const adminUser_utils_1 = require("../../utils/adminUser.utils");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_utils_1 = require("../../utils/validation.utils");
/**
 * Assign role to admin user
 */
const assignRole = (assignData, assignedBy) => __awaiter(void 0, void 0, void 0, function* () {
    const { adminUserId, roleId } = assignData;
    // Validate required fields
    (0, validation_utils_1.validateRequiredFields)(assignData, ['adminUserId', 'roleId']);
    // Check if admin user exists and is active
    const adminUser = yield models_1.AdminUser.findOne({
        where: { id: adminUserId, isActive: true },
    });
    if (!adminUser) {
        throw (0, errorHandler_1.createError)('Admin user not found or inactive', 404);
    }
    // Check if role exists and is active
    const role = yield models_1.Role.findOne({
        where: { id: roleId, isActive: true },
    });
    if (!role) {
        throw (0, errorHandler_1.createError)('Role not found or inactive', 404);
    }
    // Check if assignment already exists
    const existingAssignment = yield models_1.AdminUserRole.findOne({
        where: { adminUserId, roleId },
    });
    if (existingAssignment) {
        throw (0, errorHandler_1.createError)('Role is already assigned to this admin user', 409);
    }
    // Create assignment
    yield models_1.AdminUserRole.create({
        adminUserId,
        roleId,
        assignedBy,
    });
    // Get updated admin user with roles
    const updatedUser = yield (0, adminUser_utils_1.getAdminUserWithRolesAndPermissions)(adminUserId);
    return (0, adminUser_utils_1.formatAdminUserResponse)(updatedUser);
});
exports.assignRole = assignRole;
/**
 * Remove role from admin user
 */
const removeRole = (adminUserId, roleId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if assignment exists
    const assignment = yield models_1.AdminUserRole.findOne({
        where: { adminUserId, roleId },
    });
    if (!assignment) {
        throw (0, errorHandler_1.createError)('Role is not assigned to this admin user', 404);
    }
    // Remove assignment
    yield assignment.destroy();
    // Get updated admin user with roles
    const updatedUser = yield (0, adminUser_utils_1.getAdminUserWithRolesAndPermissions)(adminUserId);
    if (!updatedUser) {
        throw (0, errorHandler_1.createError)('Admin user not found', 404);
    }
    return (0, adminUser_utils_1.formatAdminUserResponse)(updatedUser);
});
exports.removeRole = removeRole;
/**
 * Get all roles assigned to an admin user
 */
const getUserRoles = (adminUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const adminUser = yield models_1.AdminUser.findByPk(adminUserId, {
        include: [
            {
                model: models_1.Role,
                through: { attributes: [] },
                where: { isActive: true },
                required: false,
            },
        ],
    });
    if (!adminUser) {
        throw (0, errorHandler_1.createError)('Admin user not found', 404);
    }
    const roles = adminUser.Roles || [];
    return roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
    }));
});
exports.getUserRoles = getUserRoles;
/**
 * Get all admin users assigned to a role
 */
const getRoleUsers = (roleId) => __awaiter(void 0, void 0, void 0, function* () {
    const role = yield models_1.Role.findByPk(roleId, {
        include: [
            {
                model: models_1.AdminUser,
                through: { attributes: [] },
                where: { isActive: true },
                required: false,
            },
        ],
    });
    if (!role) {
        throw (0, errorHandler_1.createError)('Role not found', 404);
    }
    const adminUsers = role.AdminUsers || [];
    return adminUsers.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive,
    }));
});
exports.getRoleUsers = getRoleUsers;
/**
 * Get admin user permissions (from all assigned roles)
 */
const getUserPermissions = (adminUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const adminUser = yield (0, adminUser_utils_1.getAdminUserWithRolesAndPermissions)(adminUserId);
    if (!adminUser) {
        throw (0, errorHandler_1.createError)('Admin user not found', 404);
    }
    const userResponse = (0, adminUser_utils_1.formatAdminUserResponse)(adminUser);
    return userResponse.permissions || [];
});
exports.getUserPermissions = getUserPermissions;
/**
 * Check if admin user has specific role
 */
const hasRole = (adminUserId, roleId) => __awaiter(void 0, void 0, void 0, function* () {
    const assignment = yield models_1.AdminUserRole.findOne({
        where: { adminUserId, roleId },
    });
    return !!assignment;
});
exports.hasRole = hasRole;
/**
 * Check if admin user has any of the specified roles
 */
const hasAnyRole = (adminUserId, roleIds) => __awaiter(void 0, void 0, void 0, function* () {
    const assignments = yield models_1.AdminUserRole.findAll({
        where: {
            adminUserId,
            roleId: roleIds,
        },
    });
    return assignments.length > 0;
});
exports.hasAnyRole = hasAnyRole;
/**
 * Check if admin user has specific permission
 */
const hasPermission = (adminUserId, permission) => __awaiter(void 0, void 0, void 0, function* () {
    const permissions = yield (0, exports.getUserPermissions)(adminUserId);
    return permissions.includes(permission);
});
exports.hasPermission = hasPermission;
/**
 * Check if admin user has any of the specified permissions
 */
const hasAnyPermission = (adminUserId, permissions) => __awaiter(void 0, void 0, void 0, function* () {
    const userPermissions = yield (0, exports.getUserPermissions)(adminUserId);
    return permissions.some((permission) => userPermissions.includes(permission));
});
exports.hasAnyPermission = hasAnyPermission;
/**
 * Bulk assign roles to admin user
 */
const bulkAssignRoles = (adminUserId, roleIds, assignedBy) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if admin user exists and is active
    const adminUser = yield models_1.AdminUser.findOne({
        where: { id: adminUserId, isActive: true },
    });
    if (!adminUser) {
        throw (0, errorHandler_1.createError)('Admin user not found or inactive', 404);
    }
    // Check if all roles exist and are active
    const roles = yield models_1.Role.findAll({
        where: { id: roleIds, isActive: true },
    });
    if (roles.length !== roleIds.length) {
        throw (0, errorHandler_1.createError)('One or more roles not found or inactive', 404);
    }
    // Get existing assignments
    const existingAssignments = yield models_1.AdminUserRole.findAll({
        where: { adminUserId, roleId: roleIds },
    });
    const existingRoleIds = existingAssignments.map((assignment) => assignment.roleId);
    const newRoleIds = roleIds.filter((roleId) => !existingRoleIds.includes(roleId));
    // Create new assignments
    if (newRoleIds.length > 0) {
        const assignmentData = newRoleIds.map((roleId) => ({
            adminUserId,
            roleId,
            assignedBy,
        }));
        yield models_1.AdminUserRole.bulkCreate(assignmentData);
    }
    // Get updated admin user with roles
    const updatedUser = yield (0, adminUser_utils_1.getAdminUserWithRolesAndPermissions)(adminUserId);
    return (0, adminUser_utils_1.formatAdminUserResponse)(updatedUser);
});
exports.bulkAssignRoles = bulkAssignRoles;
/**
 * Remove all roles from admin user
 */
const removeAllRoles = (adminUserId) => __awaiter(void 0, void 0, void 0, function* () {
    // Remove all assignments
    yield models_1.AdminUserRole.destroy({
        where: { adminUserId },
    });
    // Get updated admin user
    const updatedUser = yield models_1.AdminUser.findByPk(adminUserId);
    if (!updatedUser) {
        throw (0, errorHandler_1.createError)('Admin user not found', 404);
    }
    return {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        isActive: updatedUser.isActive,
        roles: [],
        permissions: [],
    };
});
exports.removeAllRoles = removeAllRoles;
//# sourceMappingURL=adminUserRole.service.js.map