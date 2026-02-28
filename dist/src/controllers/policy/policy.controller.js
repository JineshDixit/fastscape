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
exports.searchPoliciesByPermission = exports.getPolicyByName = exports.deactivatePolicy = exports.activatePolicy = exports.getPolicyRoles = exports.removePermissionFromPolicy = exports.addPermissionToPolicy = exports.deletePolicy = exports.updatePolicy = exports.getAllPolicies = exports.getPolicyById = exports.createPolicy = void 0;
const policy_service_1 = require("../../services/policy/policy.service");
const response_utils_1 = require("../../utils/response.utils");
const errorHandler_1 = require("../../services/middleware/errorHandler");
/**
 * Create a new policy
 */
const createPolicy = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, permissions, description } = req.body;
        const result = yield (0, policy_service_1.create)({ name, permissions, description });
        (0, response_utils_1.sendCreated)(res, 'Policy created successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.createPolicy = createPolicy;
/**
 * Get policy by ID
 */
const getPolicyById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, policy_service_1.getById)(id);
        (0, response_utils_1.sendSuccess)(res, 'Policy retrieved successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.getPolicyById = getPolicyById;
/**
 * Get all policies with pagination
 */
const getAllPolicies = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page, limit } = (0, response_utils_1.parsePaginationParams)(req.query);
        const { search, isActive } = req.query;
        const activeFilter = isActive !== undefined ? isActive === 'true' : undefined;
        const result = yield (0, policy_service_1.getAll)(page, limit, search, activeFilter);
        const pagination = (0, response_utils_1.calculatePagination)(result.total, page, limit);
        (0, response_utils_1.sendSuccessWithPagination)(res, 'Policies retrieved successfully', result.policies, pagination);
    }
    catch (error) {
        next(error);
    }
});
exports.getAllPolicies = getAllPolicies;
/**
 * Update policy
 */
const updatePolicy = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, permissions, description, isActive } = req.body;
        const result = yield (0, policy_service_1.update)(id, {
            name,
            permissions,
            description,
            isActive,
        });
        (0, response_utils_1.sendSuccess)(res, 'Policy updated successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.updatePolicy = updatePolicy;
/**
 * Delete policy
 */
const deletePolicy = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield (0, policy_service_1.remove)(id);
        (0, response_utils_1.sendSuccess)(res, 'Policy deleted successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.deletePolicy = deletePolicy;
/**
 * Add permission to policy
 */
const addPermissionToPolicy = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { permission } = req.body;
        if (!permission) {
            throw (0, errorHandler_1.createError)('Permission is required', 400);
        }
        const result = yield (0, policy_service_1.addPermission)(id, permission);
        (0, response_utils_1.sendSuccess)(res, 'Permission added successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.addPermissionToPolicy = addPermissionToPolicy;
/**
 * Remove permission from policy
 */
const removePermissionFromPolicy = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { permission } = req.body;
        if (!permission) {
            throw (0, errorHandler_1.createError)('Permission is required', 400);
        }
        const result = yield (0, policy_service_1.removePermission)(id, permission);
        (0, response_utils_1.sendSuccess)(res, 'Permission removed successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.removePermissionFromPolicy = removePermissionFromPolicy;
/**
 * Get roles that have this policy
 */
const getPolicyRoles = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, policy_service_1.getRoles)(id);
        (0, response_utils_1.sendSuccess)(res, 'Policy roles retrieved successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.getPolicyRoles = getPolicyRoles;
/**
 * Activate policy
 */
const activatePolicy = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, policy_service_1.activate)(id);
        (0, response_utils_1.sendSuccess)(res, 'Policy activated successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.activatePolicy = activatePolicy;
/**
 * Deactivate policy
 */
const deactivatePolicy = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, policy_service_1.deactivate)(id);
        (0, response_utils_1.sendSuccess)(res, 'Policy deactivated successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.deactivatePolicy = deactivatePolicy;
/**
 * Get policy by name
 */
const getPolicyByName = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name } = req.params;
        if (!name) {
            throw (0, errorHandler_1.createError)('Policy name is required', 400);
        }
        const result = yield (0, policy_service_1.getByName)(name);
        if (!result) {
            throw (0, errorHandler_1.createError)('Policy not found', 404);
        }
        (0, response_utils_1.sendSuccess)(res, 'Policy retrieved successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.getPolicyByName = getPolicyByName;
/**
 * Search policies by permission
 */
const searchPoliciesByPermission = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { permission } = req.params;
        if (!permission) {
            throw (0, errorHandler_1.createError)('Permission is required', 400);
        }
        const result = yield (0, policy_service_1.searchByPermission)(permission);
        (0, response_utils_1.sendSuccess)(res, 'Policies retrieved successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.searchPoliciesByPermission = searchPoliciesByPermission;
//# sourceMappingURL=policy.controller.js.map