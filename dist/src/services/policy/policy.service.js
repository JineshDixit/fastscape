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
exports.searchByPermission = exports.getByName = exports.isActive = exports.exists = exports.deactivate = exports.activate = exports.getRoles = exports.removePermission = exports.addPermission = exports.remove = exports.update = exports.getAll = exports.getById = exports.create = void 0;
const models_1 = require("../../models");
const role_utils_1 = require("../../utils/role.utils");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_utils_1 = require("../../utils/validation.utils");
const sequelize_1 = require("sequelize");
/**
 * Validate permissions array
 */
const validatePermissions = (permissions) => {
    if (!Array.isArray(permissions)) {
        throw (0, errorHandler_1.createError)('Permissions must be an array', 400);
    }
    (0, validation_utils_1.validateArrayLength)(permissions, 1, 50, 'Permissions');
    // Check if all permissions are strings and not empty
    const invalidPermissions = permissions.filter((permission) => typeof permission !== 'string' || permission.trim() === '');
    if (invalidPermissions.length > 0) {
        throw (0, errorHandler_1.createError)('All permissions must be non-empty strings', 400);
    }
    // Check for duplicate permissions
    const uniquePermissions = new Set(permissions);
    if (uniquePermissions.size !== permissions.length) {
        throw (0, errorHandler_1.createError)('Duplicate permissions are not allowed', 400);
    }
};
/**
 * Create new policy
 */
const create = (policyData) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, permissions, description } = policyData;
    // Validate required fields
    (0, validation_utils_1.validateRequiredFields)(policyData, ['name', 'permissions']);
    validatePermissions(permissions);
    // Check if policy already exists
    const existingPolicy = yield models_1.Policy.findOne({ where: { name } });
    if (existingPolicy) {
        throw (0, errorHandler_1.createError)('Policy with this name already exists', 409);
    }
    // Create policy
    const policy = yield models_1.Policy.create({
        name,
        permissions,
        description,
        isActive: true,
    });
    return (0, role_utils_1.formatPolicyResponse)(policy);
});
exports.create = create;
/**
 * Get policy by ID
 */
const getById = (policyId) => __awaiter(void 0, void 0, void 0, function* () {
    const policy = yield models_1.Policy.findByPk(policyId);
    if (!policy) {
        throw (0, errorHandler_1.createError)('Policy not found', 404);
    }
    return (0, role_utils_1.formatPolicyResponse)(policy);
});
exports.getById = getById;
/**
 * Get all policies with pagination
 */
const getAll = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 20, search, isActive) {
    const offset = (page - 1) * limit;
    const whereClause = {};
    if (search) {
        whereClause[sequelize_1.Op.or] = [{ name: { [sequelize_1.Op.iLike]: `%${search}%` } }, { description: { [sequelize_1.Op.iLike]: `%${search}%` } }];
    }
    if (isActive !== undefined) {
        whereClause.isActive = isActive;
    }
    const { rows: policies, count: total } = yield models_1.Policy.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });
    return {
        policies: policies.map(role_utils_1.formatPolicyResponse),
        total,
        totalPages: Math.ceil(total / limit),
    };
});
exports.getAll = getAll;
/**
 * Update policy
 */
const update = (policyId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    const policy = yield models_1.Policy.findByPk(policyId);
    if (!policy) {
        throw (0, errorHandler_1.createError)('Policy not found', 404);
    }
    // If name is being updated, check for duplicates
    if (updateData.name) {
        const existingPolicy = yield models_1.Policy.findOne({
            where: {
                name: updateData.name,
                id: { [sequelize_1.Op.ne]: policyId },
            },
        });
        if (existingPolicy) {
            throw (0, errorHandler_1.createError)('Policy with this name already exists', 409);
        }
    }
    // Validate permissions if being updated
    if (updateData.permissions) {
        validatePermissions(updateData.permissions);
    }
    // Update policy
    yield policy.update(updateData);
    return (0, role_utils_1.formatPolicyResponse)(policy);
});
exports.update = update;
/**
 * Delete policy (soft delete by deactivating)
 */
const remove = (policyId) => __awaiter(void 0, void 0, void 0, function* () {
    const policy = yield models_1.Policy.findByPk(policyId);
    if (!policy) {
        throw (0, errorHandler_1.createError)('Policy not found', 404);
    }
    // Check if policy is assigned to any roles
    const rolesWithPolicy = yield models_1.Role.findAll({
        include: [
            {
                model: models_1.Policy,
                through: { attributes: [] },
                where: { id: policyId },
            },
        ],
    });
    if (rolesWithPolicy.length > 0) {
        throw (0, errorHandler_1.createError)('Cannot delete policy that is assigned to roles', 400);
    }
    // Soft delete by deactivating
    yield policy.update({ isActive: false });
});
exports.remove = remove;
/**
 * Add permission to policy
 */
const addPermission = (policyId, permission) => __awaiter(void 0, void 0, void 0, function* () {
    const policy = yield models_1.Policy.findByPk(policyId);
    if (!policy) {
        throw (0, errorHandler_1.createError)('Policy not found', 404);
    }
    if (typeof permission !== 'string' || permission.trim() === '') {
        throw (0, errorHandler_1.createError)('Permission must be a non-empty string', 400);
    }
    const trimmedPermission = permission.trim();
    // Check if permission already exists
    if (policy.permissions.includes(trimmedPermission)) {
        throw (0, errorHandler_1.createError)('Permission already exists in this policy', 409);
    }
    // Add permission
    const updatedPermissions = [...policy.permissions, trimmedPermission];
    yield policy.update({ permissions: updatedPermissions });
    return (0, role_utils_1.formatPolicyResponse)(policy);
});
exports.addPermission = addPermission;
/**
 * Remove permission from policy
 */
const removePermission = (policyId, permission) => __awaiter(void 0, void 0, void 0, function* () {
    const policy = yield models_1.Policy.findByPk(policyId);
    if (!policy) {
        throw (0, errorHandler_1.createError)('Policy not found', 404);
    }
    // Check if permission exists
    if (!policy.permissions.includes(permission)) {
        throw (0, errorHandler_1.createError)('Permission not found in this policy', 404);
    }
    // Remove permission
    const updatedPermissions = policy.permissions.filter((p) => p !== permission);
    if (updatedPermissions.length === 0) {
        throw (0, errorHandler_1.createError)('Cannot remove all permissions from policy', 400);
    }
    yield policy.update({ permissions: updatedPermissions });
    return (0, role_utils_1.formatPolicyResponse)(policy);
});
exports.removePermission = removePermission;
/**
 * Get roles that have this policy
 */
const getRoles = (policyId) => __awaiter(void 0, void 0, void 0, function* () {
    const policy = yield (0, role_utils_1.getPolicyWithRoles)(policyId);
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
exports.getRoles = getRoles;
/**
 * Activate policy
 */
const activate = (policyId) => __awaiter(void 0, void 0, void 0, function* () {
    const policy = yield models_1.Policy.findByPk(policyId);
    if (!policy) {
        throw (0, errorHandler_1.createError)('Policy not found', 404);
    }
    yield policy.update({ isActive: true });
    return (0, role_utils_1.formatPolicyResponse)(policy);
});
exports.activate = activate;
/**
 * Deactivate policy
 */
const deactivate = (policyId) => __awaiter(void 0, void 0, void 0, function* () {
    const policy = yield models_1.Policy.findByPk(policyId);
    if (!policy) {
        throw (0, errorHandler_1.createError)('Policy not found', 404);
    }
    yield policy.update({ isActive: false });
    return (0, role_utils_1.formatPolicyResponse)(policy);
});
exports.deactivate = deactivate;
/**
 * Check if policy exists
 */
const exists = (policyId) => __awaiter(void 0, void 0, void 0, function* () {
    const policy = yield models_1.Policy.findByPk(policyId);
    return !!policy;
});
exports.exists = exists;
/**
 * Check if policy is active
 */
const isActive = (policyId) => __awaiter(void 0, void 0, void 0, function* () {
    const policy = yield models_1.Policy.findByPk(policyId);
    return (policy === null || policy === void 0 ? void 0 : policy.isActive) || false;
});
exports.isActive = isActive;
/**
 * Get policy by name
 */
const getByName = (name) => __awaiter(void 0, void 0, void 0, function* () {
    const policy = yield models_1.Policy.findOne({ where: { name } });
    if (!policy) {
        return null;
    }
    return (0, role_utils_1.formatPolicyResponse)(policy);
});
exports.getByName = getByName;
/**
 * Search policies by permission
 */
const searchByPermission = (permission) => __awaiter(void 0, void 0, void 0, function* () {
    const policies = yield models_1.Policy.findAll({
        where: {
            permissions: {
                [sequelize_1.Op.contains]: [permission],
            },
            isActive: true,
        },
        order: [['name', 'ASC']],
    });
    return policies.map(role_utils_1.formatPolicyResponse);
});
exports.searchByPermission = searchByPermission;
//# sourceMappingURL=policy.service.js.map