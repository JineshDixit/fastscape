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
exports.removeAllPolicies = exports.bulkAssignPolicies = exports.hasAnyPermission = exports.hasPermission = exports.getRolePermissions = exports.hasAnyPolicy = exports.hasPolicy = exports.getPolicyRoles = exports.getRolePolicies = exports.removePolicy = exports.assignPolicy = void 0;
const models_1 = require("../../models");
const role_utils_1 = require("../../utils/role.utils");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_utils_1 = require("../../utils/validation.utils");
/**
 * Assign policy to role
 */
const assignPolicy = (assignData) => __awaiter(void 0, void 0, void 0, function* () {
    const { roleId, policyId } = assignData;
    // Validate required fields
    (0, validation_utils_1.validateRequiredFields)(assignData, ['roleId', 'policyId']);
    // Check if role exists and is active
    const role = yield models_1.Role.findOne({
        where: { id: roleId, isActive: true },
    });
    if (!role) {
        throw (0, errorHandler_1.createError)('Role not found or inactive', 404);
    }
    // Check if policy exists and is active
    const policy = yield models_1.Policy.findOne({
        where: { id: policyId, isActive: true },
    });
    if (!policy) {
        throw (0, errorHandler_1.createError)('Policy not found or inactive', 404);
    }
    // Check if assignment already exists
    const existingAssignment = yield models_1.RolePolicy.findOne({
        where: { roleId, policyId },
    });
    if (existingAssignment) {
        throw (0, errorHandler_1.createError)('Policy is already assigned to this role', 409);
    }
    // Create assignment
    yield models_1.RolePolicy.create({
        roleId,
        policyId,
    });
    // Get updated role with policies
    const updatedRole = yield (0, role_utils_1.getRoleWithPolicies)(roleId);
    return (0, role_utils_1.formatRoleWithPoliciesResponse)(updatedRole);
});
exports.assignPolicy = assignPolicy;
/**
 * Remove policy from role
 */
const removePolicy = (roleId, policyId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if assignment exists
    const assignment = yield models_1.RolePolicy.findOne({
        where: { roleId, policyId },
    });
    if (!assignment) {
        throw (0, errorHandler_1.createError)('Policy is not assigned to this role', 404);
    }
    // Remove assignment
    yield assignment.destroy();
    // Get updated role with policies
    const updatedRole = yield (0, role_utils_1.getRoleWithPolicies)(roleId);
    if (!updatedRole) {
        throw (0, errorHandler_1.createError)('Role not found', 404);
    }
    return (0, role_utils_1.formatRoleWithPoliciesResponse)(updatedRole);
});
exports.removePolicy = removePolicy;
/**
 * Get all policies assigned to a role
 */
const getRolePolicies = (roleId) => __awaiter(void 0, void 0, void 0, function* () {
    const role = yield (0, role_utils_1.getRoleWithPolicies)(roleId);
    if (!role) {
        throw (0, errorHandler_1.createError)('Role not found', 404);
    }
    const policies = role.Policies || [];
    return policies.map((policy) => (0, role_utils_1.formatPolicyResponse)(policy));
});
exports.getRolePolicies = getRolePolicies;
/**
 * Get all roles that have a specific policy
 */
const getPolicyRoles = (policyId) => __awaiter(void 0, void 0, void 0, function* () {
    const policy = yield models_1.Policy.findByPk(policyId, {
        include: [
            {
                model: models_1.Role,
                through: { attributes: [] },
                where: { isActive: true },
                required: false,
            },
        ],
    });
    if (!policy) {
        throw (0, errorHandler_1.createError)('Policy not found', 404);
    }
    const roles = policy.Roles || [];
    return roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
    }));
});
exports.getPolicyRoles = getPolicyRoles;
/**
 * Check if role has specific policy
 */
const hasPolicy = (roleId, policyId) => __awaiter(void 0, void 0, void 0, function* () {
    const assignment = yield models_1.RolePolicy.findOne({
        where: { roleId, policyId },
    });
    return !!assignment;
});
exports.hasPolicy = hasPolicy;
/**
 * Check if role has any of the specified policies
 */
const hasAnyPolicy = (roleId, policyIds) => __awaiter(void 0, void 0, void 0, function* () {
    const assignments = yield models_1.RolePolicy.findAll({
        where: {
            roleId,
            policyId: policyIds,
        },
    });
    return assignments.length > 0;
});
exports.hasAnyPolicy = hasAnyPolicy;
/**
 * Get all permissions for a role (from all assigned policies)
 */
const getRolePermissions = (roleId) => __awaiter(void 0, void 0, void 0, function* () {
    const role = yield (0, role_utils_1.getRoleWithPolicies)(roleId);
    if (!role) {
        throw (0, errorHandler_1.createError)('Role not found', 404);
    }
    const policies = role.Policies || [];
    const permissions = new Set();
    // Collect all permissions from all policies
    policies.forEach((policy) => {
        policy.permissions.forEach((permission) => {
            permissions.add(permission);
        });
    });
    return Array.from(permissions);
});
exports.getRolePermissions = getRolePermissions;
/**
 * Check if role has specific permission
 */
const hasPermission = (roleId, permission) => __awaiter(void 0, void 0, void 0, function* () {
    const permissions = yield (0, exports.getRolePermissions)(roleId);
    return permissions.includes(permission);
});
exports.hasPermission = hasPermission;
/**
 * Check if role has any of the specified permissions
 */
const hasAnyPermission = (roleId, permissions) => __awaiter(void 0, void 0, void 0, function* () {
    const rolePermissions = yield (0, exports.getRolePermissions)(roleId);
    return permissions.some((permission) => rolePermissions.includes(permission));
});
exports.hasAnyPermission = hasAnyPermission;
/**
 * Bulk assign policies to role
 */
const bulkAssignPolicies = (roleId, policyIds) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if role exists and is active
    const role = yield models_1.Role.findOne({
        where: { id: roleId, isActive: true },
    });
    if (!role) {
        throw (0, errorHandler_1.createError)('Role not found or inactive', 404);
    }
    // Check if all policies exist and are active
    const policies = yield models_1.Policy.findAll({
        where: { id: policyIds, isActive: true },
    });
    if (policies.length !== policyIds.length) {
        throw (0, errorHandler_1.createError)('One or more policies not found or inactive', 404);
    }
    // Get existing assignments
    const existingAssignments = yield models_1.RolePolicy.findAll({
        where: { roleId, policyId: policyIds },
    });
    const existingPolicyIds = existingAssignments.map((assignment) => assignment.policyId);
    const newPolicyIds = policyIds.filter((policyId) => !existingPolicyIds.includes(policyId));
    // Create new assignments
    if (newPolicyIds.length > 0) {
        const assignmentData = newPolicyIds.map((policyId) => ({
            roleId,
            policyId,
        }));
        yield models_1.RolePolicy.bulkCreate(assignmentData);
    }
    // Get updated role with policies
    const updatedRole = yield (0, role_utils_1.getRoleWithPolicies)(roleId);
    return (0, role_utils_1.formatRoleWithPoliciesResponse)(updatedRole);
});
exports.bulkAssignPolicies = bulkAssignPolicies;
/**
 * Remove all policies from role
 */
const removeAllPolicies = (roleId) => __awaiter(void 0, void 0, void 0, function* () {
    // Remove all assignments
    yield models_1.RolePolicy.destroy({
        where: { roleId },
    });
    // Get updated role
    const updatedRole = yield models_1.Role.findByPk(roleId);
    if (!updatedRole) {
        throw (0, errorHandler_1.createError)('Role not found', 404);
    }
    return {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
        isActive: updatedRole.isActive,
        policies: [],
    };
});
exports.removeAllPolicies = removeAllPolicies;
//# sourceMappingURL=rolePolicy.service.js.map