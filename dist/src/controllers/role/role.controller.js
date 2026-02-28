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
exports.getRoleByName = exports.deactivateRole = exports.activateRole = exports.deleteRole = exports.updateRole = exports.getAllRoles = exports.getRoleById = exports.createRole = void 0;
const role_service_1 = require("../../services/role/role.service");
const response_utils_1 = require("../../utils/response.utils");
const errorHandler_1 = require("../../services/middleware/errorHandler");
/**
 * Create a new role
 */
const createRole = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, policyIds } = req.body;
        const result = yield (0, role_service_1.create)({ name, description, policyIds });
        (0, response_utils_1.sendCreated)(res, 'Role created successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.createRole = createRole;
/**
 * Get role by ID
 */
const getRoleById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, role_service_1.getById)(id);
        (0, response_utils_1.sendSuccess)(res, 'Role retrieved successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.getRoleById = getRoleById;
/**
 * Get all roles with pagination
 */
const getAllRoles = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page, limit } = (0, response_utils_1.parsePaginationParams)(req.query);
        const { search, isActive, includePolicies } = req.query;
        const activeFilter = isActive !== undefined ? isActive === 'true' : undefined;
        const includePoliciesFlag = includePolicies === 'true';
        const result = yield (0, role_service_1.getAll)(page, limit, search, activeFilter, includePoliciesFlag);
        const pagination = (0, response_utils_1.calculatePagination)(result.total, page, limit);
        (0, response_utils_1.sendSuccessWithPagination)(res, 'Roles retrieved successfully', result.roles, pagination);
    }
    catch (error) {
        next(error);
    }
});
exports.getAllRoles = getAllRoles;
/**
 * Update role
 */
const updateRole = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;
        const result = yield (0, role_service_1.update)(id, {
            name,
            description,
            isActive,
        });
        (0, response_utils_1.sendSuccess)(res, 'Role updated successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.updateRole = updateRole;
/**
 * Delete role
 */
const deleteRole = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield (0, role_service_1.remove)(id);
        (0, response_utils_1.sendSuccess)(res, 'Role deleted successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.deleteRole = deleteRole;
/**
 * Activate role
 */
const activateRole = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, role_service_1.activate)(id);
        (0, response_utils_1.sendSuccess)(res, 'Role activated successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.activateRole = activateRole;
/**
 * Deactivate role
 */
const deactivateRole = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, role_service_1.deactivate)(id);
        (0, response_utils_1.sendSuccess)(res, 'Role deactivated successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.deactivateRole = deactivateRole;
/**
 * Get role by name
 */
const getRoleByName = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name } = req.params;
        if (!name) {
            throw (0, errorHandler_1.createError)('Role name is required', 400);
        }
        const result = yield (0, role_service_1.getByName)(name);
        if (!result) {
            throw (0, errorHandler_1.createError)('Role not found', 404);
        }
        (0, response_utils_1.sendSuccess)(res, 'Role retrieved successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.getRoleByName = getRoleByName;
//# sourceMappingURL=role.controller.js.map