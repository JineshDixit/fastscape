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
exports.getPolicyWithRoles = exports.getRoleWithPolicies = exports.POLICY_WITH_ROLES_INCLUDE = exports.ROLE_WITH_POLICIES_INCLUDE = exports.formatPolicyResponse = exports.formatRoleWithPoliciesResponse = exports.formatRoleResponse = void 0;
const models_1 = require("../models");
/**
 * Format role response
 */
const formatRoleResponse = (role) => {
    return {
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
    };
};
exports.formatRoleResponse = formatRoleResponse;
/**
 * Format role response with policies
 * Industrial standard: Explicit type mapping for concatenated responses.
 */
const formatRoleWithPoliciesResponse = (role) => {
    const roleWithAssoc = role;
    const policies = roleWithAssoc.Policies || [];
    return {
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        policies: policies.map((policy) => ({
            id: policy.id,
            name: policy.name,
            permissions: policy.permissions,
            description: policy.description,
            isActive: policy.isActive,
        })),
    };
};
exports.formatRoleWithPoliciesResponse = formatRoleWithPoliciesResponse;
/**
 * Format policy response
 */
const formatPolicyResponse = (policy) => {
    return {
        id: policy.id,
        name: policy.name,
        permissions: policy.permissions,
        description: policy.description,
        isActive: policy.isActive,
    };
};
exports.formatPolicyResponse = formatPolicyResponse;
/**
 * Centralized include for Role with Policies
 */
exports.ROLE_WITH_POLICIES_INCLUDE = [
    {
        model: models_1.Policy,
        through: { attributes: [] },
        where: { isActive: true },
        required: false,
    },
];
/**
 * Centralized include for Policy with Roles
 */
exports.POLICY_WITH_ROLES_INCLUDE = [
    {
        model: models_1.Role,
        through: { attributes: [] },
        where: { isActive: true },
        required: false,
    },
];
/**
 * Get role with policies - centralized query
 */
const getRoleWithPolicies = (roleId) => __awaiter(void 0, void 0, void 0, function* () {
    const role = yield models_1.Role.findByPk(roleId, {
        include: exports.ROLE_WITH_POLICIES_INCLUDE,
    });
    return role;
});
exports.getRoleWithPolicies = getRoleWithPolicies;
/**
 * Get policy with roles - centralized query
 */
const getPolicyWithRoles = (policyId) => __awaiter(void 0, void 0, void 0, function* () {
    const policy = yield models_1.Policy.findByPk(policyId, {
        include: exports.POLICY_WITH_ROLES_INCLUDE,
    });
    return policy;
});
exports.getPolicyWithRoles = getPolicyWithRoles;
//# sourceMappingURL=role.utils.js.map