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
exports.getAdminUserWithRolesAndPermissions = exports.formatAdminUserResponse = void 0;
const models_1 = require("../models");
const constants_1 = require("../common/constants/constants");
/**
 * Format admin user response with roles and permissions.
 * Industrial standard: Explicit type mapping and defensive coding for associations.
 */
const formatAdminUserResponse = (user) => {
    const adminUser = user;
    const roles = adminUser.Roles || [];
    const permissions = new Set();
    // Collect all permissions from all roles
    roles.forEach((role) => {
        const policies = role.Policies || [];
        policies.forEach((policy) => {
            if (Array.isArray(policy.permissions)) {
                policy.permissions.forEach((permission) => {
                    permissions.add(permission);
                });
            }
        });
    });
    return {
        id: adminUser.id,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        fullName: adminUser.fullName,
        email: adminUser.email,
        isActive: adminUser.isActive,
        roles: roles.map((role) => ({
            id: role.id,
            name: role.name,
            description: role.description,
            isActive: role.isActive,
        })),
        permissions: Array.from(permissions),
    };
};
exports.formatAdminUserResponse = formatAdminUserResponse;
/**
 * Get admin user with roles and permissions - centralized query.
 * Industrial standard: encapsulate complex queries in helper functions.
 */
const getAdminUserWithRolesAndPermissions = (adminUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield models_1.AdminUser.findByPk(adminUserId, {
        include: constants_1.ADMIN_USER_ROLES_POLICIES_INCLUDE,
    });
    return user;
});
exports.getAdminUserWithRolesAndPermissions = getAdminUserWithRolesAndPermissions;
//# sourceMappingURL=adminUser.utils.js.map