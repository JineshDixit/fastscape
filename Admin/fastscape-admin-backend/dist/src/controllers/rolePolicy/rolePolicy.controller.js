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
exports.removeAllPoliciesFromRole = exports.bulkAssignPoliciesToRole = exports.checkRoleHasAnyPermission = exports.checkRoleHasPermission = exports.getRolePermissionsById = exports.checkRoleHasAnyPolicy = exports.checkRoleHasPolicy = exports.getPolicyRolesById = exports.getRolePoliciesById = exports.removePolicyFromRole = exports.assignPolicyToRole = void 0;
const rolePolicy_service_1 = require("../../services/rolePolicy/rolePolicy.service");
const response_utils_1 = require("../../utils/response.utils");
const errorHandler_1 = require("../../services/middleware/errorHandler");
/**
 * Assign policy to role
 */
const assignPolicyToRole = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roleId, policyId } = req.body;
        if (!roleId || !policyId) {
            throw (0, errorHandler_1.createError)('Role ID and Policy ID are required', 400);
        }
        const result = yield (0, rolePolicy_service_1.assignPolicy)({ roleId, policyId });
        (0, response_utils_1.sendCreated)(res, 'Policy assigned to role successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.assignPolicyToRole = assignPolicyToRole;
/**
 * Remove policy from role
 */
const removePolicyFromRole = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roleId, policyId } = req.body;
        if (!roleId || !policyId) {
            throw (0, errorHandler_1.createError)('Role ID and Policy ID are required', 400);
        }
        const result = yield (0, rolePolicy_service_1.removePolicy)(roleId, policyId);
        (0, response_utils_1.sendSuccess)(res, 'Policy removed from role successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.removePolicyFromRole = removePolicyFromRole;
/**
 * Get all policies assigned to a role
 */
const getRolePoliciesById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roleId } = req.params;
        const result = yield (0, rolePolicy_service_1.getRolePolicies)(roleId);
        (0, response_utils_1.sendSuccess)(res, 'Role policies retrieved successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.getRolePoliciesById = getRolePoliciesById;
/**
 * Get all roles that have a specific policy
 */
const getPolicyRolesById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { policyId } = req.params;
        const result = yield (0, rolePolicy_service_1.getPolicyRoles)(policyId);
        (0, response_utils_1.sendSuccess)(res, 'Policy roles retrieved successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.getPolicyRolesById = getPolicyRolesById;
/**
 * Check if role has specific policy
 */
const checkRoleHasPolicy = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roleId, policyId } = req.params;
        const result = yield (0, rolePolicy_service_1.hasPolicy)(roleId, policyId);
        (0, response_utils_1.sendSuccess)(res, 'Policy check completed', { hasPolicy: result });
    }
    catch (error) {
        next(error);
    }
});
exports.checkRoleHasPolicy = checkRoleHasPolicy;
/**
 * Check if role has any of the specified policies
 */
const checkRoleHasAnyPolicy = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roleId } = req.params;
        const { policyIds } = req.body;
        if (!Array.isArray(policyIds) || policyIds.length === 0) {
            throw (0, errorHandler_1.createError)('Policy IDs array is required', 400);
        }
        const result = yield (0, rolePolicy_service_1.hasAnyPolicy)(roleId, policyIds);
        (0, response_utils_1.sendSuccess)(res, 'Policy check completed', { hasAnyPolicy: result });
    }
    catch (error) {
        next(error);
    }
});
exports.checkRoleHasAnyPolicy = checkRoleHasAnyPolicy;
/**
 * Get all permissions for a role
 */
const getRolePermissionsById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roleId } = req.params;
        const result = yield (0, rolePolicy_service_1.getRolePermissions)(roleId);
        (0, response_utils_1.sendSuccess)(res, 'Role permissions retrieved successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.getRolePermissionsById = getRolePermissionsById;
/**
 * Check if role has specific permission
 */
const checkRoleHasPermission = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roleId, permission } = req.params;
        if (!permission) {
            throw (0, errorHandler_1.createError)('Permission is required', 400);
        }
        const result = yield (0, rolePolicy_service_1.hasPermission)(roleId, permission);
        (0, response_utils_1.sendSuccess)(res, 'Permission check completed', { hasPermission: result });
    }
    catch (error) {
        next(error);
    }
});
exports.checkRoleHasPermission = checkRoleHasPermission;
/**
 * Check if role has any of the specified permissions
 */
const checkRoleHasAnyPermission = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roleId } = req.params;
        const { permissions } = req.body;
        if (!Array.isArray(permissions) || permissions.length === 0) {
            throw (0, errorHandler_1.createError)('Permissions array is required', 400);
        }
        const result = yield (0, rolePolicy_service_1.hasAnyPermission)(roleId, permissions);
        (0, response_utils_1.sendSuccess)(res, 'Permission check completed', { hasAnyPermission: result });
    }
    catch (error) {
        next(error);
    }
});
exports.checkRoleHasAnyPermission = checkRoleHasAnyPermission;
/**
 * Bulk assign policies to role
 */
const bulkAssignPoliciesToRole = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roleId } = req.params;
        const { policyIds } = req.body;
        if (!Array.isArray(policyIds) || policyIds.length === 0) {
            throw (0, errorHandler_1.createError)('Policy IDs array is required', 400);
        }
        const result = yield (0, rolePolicy_service_1.bulkAssignPolicies)(roleId, policyIds);
        (0, response_utils_1.sendSuccess)(res, 'Policies assigned to role successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.bulkAssignPoliciesToRole = bulkAssignPoliciesToRole;
/**
 * Remove all policies from role
 */
const removeAllPoliciesFromRole = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roleId } = req.params;
        const result = yield (0, rolePolicy_service_1.removeAllPolicies)(roleId);
        (0, response_utils_1.sendSuccess)(res, 'All policies removed from role successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.removeAllPoliciesFromRole = removeAllPoliciesFromRole;
//# sourceMappingURL=rolePolicy.controller.js.map