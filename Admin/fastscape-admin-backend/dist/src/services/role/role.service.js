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
exports.getByName = exports.isActive = exports.exists = exports.deactivate = exports.activate = exports.remove = exports.update = exports.getAll = exports.getById = exports.create = void 0;
const models_1 = require("../../models");
const role_utils_1 = require("../../utils/role.utils");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_utils_1 = require("../../utils/validation.utils");
const sequelize_1 = require("sequelize");
/**
 * Create new role
 */
const create = (roleData) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description, policyIds } = roleData;
    // Validate required fields
    (0, validation_utils_1.validateRequiredFields)(roleData, ['name']);
    // Check if role already exists
    const existingRole = yield models_1.Role.findOne({ where: { name } });
    if (existingRole) {
        throw (0, errorHandler_1.createError)('Role with this name already exists', 409);
    }
    // Create role
    const role = yield models_1.Role.create({
        name,
        description,
        isActive: true,
    });
    // Assign policies if provided
    if (policyIds && policyIds.length > 0) {
        // Validate that all policies exist
        const policies = yield models_1.Policy.findAll({
            where: { id: { [sequelize_1.Op.in]: policyIds }, isActive: true },
        });
        if (policies.length !== policyIds.length) {
            throw (0, errorHandler_1.createError)('One or more policies not found or inactive', 404);
        }
        // Create role-policy associations
        const rolePolicyData = policyIds.map((policyId) => ({
            roleId: role.id,
            policyId,
        }));
        yield models_1.RolePolicy.bulkCreate(rolePolicyData);
    }
    return (0, role_utils_1.formatRoleResponse)(role);
});
exports.create = create;
/**
 * Get role by ID
 */
const getById = (roleId) => __awaiter(void 0, void 0, void 0, function* () {
    const role = yield (0, role_utils_1.getRoleWithPolicies)(roleId);
    if (!role) {
        throw (0, errorHandler_1.createError)('Role not found', 404);
    }
    return (0, role_utils_1.formatRoleWithPoliciesResponse)(role);
});
exports.getById = getById;
/**
 * Get all roles with pagination
 */
const getAll = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 20, search, isActive, includePolicies = false) {
    const offset = (page - 1) * limit;
    const whereClause = {};
    if (search) {
        whereClause[sequelize_1.Op.or] = [{ name: { [sequelize_1.Op.iLike]: `%${search}%` } }, { description: { [sequelize_1.Op.iLike]: `%${search}%` } }];
    }
    if (isActive !== undefined) {
        whereClause.isActive = isActive;
    }
    const includeOptions = includePolicies
        ? [
            {
                model: models_1.Policy,
                through: { attributes: [] },
                where: { isActive: true },
                required: false,
            },
        ]
        : [];
    const { rows: roles, count: total } = yield models_1.Role.findAndCountAll({
        where: whereClause,
        include: includeOptions,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });
    return {
        roles: roles.map((role) => (includePolicies ? (0, role_utils_1.formatRoleWithPoliciesResponse)(role) : (0, role_utils_1.formatRoleResponse)(role))),
        total,
        totalPages: Math.ceil(total / limit),
    };
});
exports.getAll = getAll;
/**
 * Update role
 */
const update = (roleId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    const role = yield models_1.Role.findByPk(roleId);
    if (!role) {
        throw (0, errorHandler_1.createError)('Role not found', 404);
    }
    // If name is being updated, check for duplicates
    if (updateData.name) {
        const existingRole = yield models_1.Role.findOne({
            where: {
                name: updateData.name,
                id: { [sequelize_1.Op.ne]: roleId },
            },
        });
        if (existingRole) {
            throw (0, errorHandler_1.createError)('Role with this name already exists', 409);
        }
    }
    // Update role
    yield role.update(updateData);
    return (0, role_utils_1.formatRoleResponse)(role);
});
exports.update = update;
/**
 * Delete role (soft delete by deactivating)
 */
const remove = (roleId) => __awaiter(void 0, void 0, void 0, function* () {
    const role = yield models_1.Role.findByPk(roleId);
    if (!role) {
        throw (0, errorHandler_1.createError)('Role not found', 404);
    }
    // Check if role is assigned to any admin users
    const adminUsersWithRole = yield models_1.AdminUser.findAll({
        include: [
            {
                model: models_1.Role,
                through: { attributes: [] },
                where: { id: roleId },
            },
        ],
    });
    if (adminUsersWithRole.length > 0) {
        throw (0, errorHandler_1.createError)('Cannot delete role that is assigned to admin users', 400);
    }
    // Soft delete by deactivating
    yield role.update({ isActive: false });
});
exports.remove = remove;
/**
 * Activate role
 */
const activate = (roleId) => __awaiter(void 0, void 0, void 0, function* () {
    const role = yield models_1.Role.findByPk(roleId);
    if (!role) {
        throw (0, errorHandler_1.createError)('Role not found', 404);
    }
    yield role.update({ isActive: true });
    return (0, role_utils_1.formatRoleResponse)(role);
});
exports.activate = activate;
/**
 * Deactivate role
 */
const deactivate = (roleId) => __awaiter(void 0, void 0, void 0, function* () {
    const role = yield models_1.Role.findByPk(roleId);
    if (!role) {
        throw (0, errorHandler_1.createError)('Role not found', 404);
    }
    yield role.update({ isActive: false });
    return (0, role_utils_1.formatRoleResponse)(role);
});
exports.deactivate = deactivate;
/**
 * Check if role exists
 */
const exists = (roleId) => __awaiter(void 0, void 0, void 0, function* () {
    const role = yield models_1.Role.findByPk(roleId);
    return !!role;
});
exports.exists = exists;
/**
 * Check if role is active
 */
const isActive = (roleId) => __awaiter(void 0, void 0, void 0, function* () {
    const role = yield models_1.Role.findByPk(roleId);
    return (role === null || role === void 0 ? void 0 : role.isActive) || false;
});
exports.isActive = isActive;
/**
 * Get role by name
 */
const getByName = (name) => __awaiter(void 0, void 0, void 0, function* () {
    const role = yield models_1.Role.findOne({ where: { name } });
    if (!role) {
        return null;
    }
    return (0, role_utils_1.formatRoleResponse)(role);
});
exports.getByName = getByName;
//# sourceMappingURL=role.service.js.map