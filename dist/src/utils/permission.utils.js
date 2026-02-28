"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasAllPermissions = exports.hasAnyPermission = exports.hasPermission = exports.extractPermissionsFromRoles = void 0;
/**
 * Extract permissions from roles and policies
 * Centralized logic used by both AuthService and Passport strategy
 */
const extractPermissionsFromRoles = (roles) => {
    const permissions = new Set();
    roles.forEach(role => {
        if (role.policies) {
            role.policies.forEach(policy => {
                policy.permissions.forEach(permission => {
                    permissions.add(permission);
                });
            });
        }
    });
    return Array.from(permissions);
};
exports.extractPermissionsFromRoles = extractPermissionsFromRoles;
/**
 * Check if a user has a specific permission
 */
const hasPermission = (userPermissions, requiredPermission) => {
    return userPermissions.includes(requiredPermission);
};
exports.hasPermission = hasPermission;
/**
 * Check if a user has any of the specified permissions
 */
const hasAnyPermission = (userPermissions, requiredPermissions) => {
    return requiredPermissions.some(permission => userPermissions.includes(permission));
};
exports.hasAnyPermission = hasAnyPermission;
/**
 * Check if a user has all of the specified permissions
 */
const hasAllPermissions = (userPermissions, requiredPermissions) => {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
};
exports.hasAllPermissions = hasAllPermissions;
//# sourceMappingURL=permission.utils.js.map