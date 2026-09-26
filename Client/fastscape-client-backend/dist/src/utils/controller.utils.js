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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = void 0;
const errorHandler_1 = require("../services/middleware/errorHandler");
const response_utils_1 = require("./response.utils");
const validation_utils_1 = require("./validation.utils");
/**
 * Base controller class with common functionality
 */
class BaseController {
    constructor() {
        /**
         * Async handler wrapper to catch errors
         */
        this.asyncHandler = (fn) => {
            return (req, res, next) => {
                Promise.resolve(fn(req, res, next)).catch(next);
            };
        };
        /**
         * Standard CRUD operations
         */
        this.handleGetById = (service, message, requireAuth = false) => {
            return this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
                const id = this.getValidatedId(req, Object.keys(req.params)[0]);
                const userId = requireAuth ? this.ensureAuthenticated(req) : undefined;
                const result = yield service(id, userId);
                (0, response_utils_1.sendSuccess)(res, message, result);
            }));
        };
        this.handleGetList = (service, message, requireAuth = false) => {
            return this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
                const userId = requireAuth ? this.ensureAuthenticated(req) : undefined;
                const filters = req.query;
                const results = yield service(filters, userId);
                (0, response_utils_1.sendSuccess)(res, message, results);
            }));
        };
        this.handleGetListWithPagination = (service, message, requireAuth = false) => {
            return this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
                const userId = requireAuth ? this.ensureAuthenticated(req) : undefined;
                const _a = req.query, { page = 1, limit = 20 } = _a, filters = __rest(_a, ["page", "limit"]);
                const pagination = {
                    page: Math.max(1, parseInt(page) || 1),
                    limit: Math.min(100, Math.max(1, parseInt(limit) || 20)),
                };
                const { items, total } = yield service(filters, pagination, userId);
                (0, response_utils_1.sendSuccessWithPagination)(res, message, items, {
                    total,
                    page: pagination.page,
                    limit: pagination.limit,
                    totalPages: Math.ceil(total / pagination.limit),
                });
            }));
        };
        this.handleCreate = (service, message, requireAuth = true) => {
            return this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
                const userId = requireAuth ? this.ensureAuthenticated(req) : undefined;
                const data = req.body;
                const result = yield service(data, userId);
                (0, response_utils_1.sendCreated)(res, message, result);
            }));
        };
        this.handleUpdate = (service, message, requireAuth = true) => {
            return this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
                const id = this.getValidatedId(req, Object.keys(req.params)[0]);
                const userId = requireAuth ? this.ensureAuthenticated(req) : undefined;
                const data = req.body;
                const result = yield service(id, data, userId);
                (0, response_utils_1.sendSuccess)(res, message, result);
            }));
        };
        this.handleDelete = (service, message, requireAuth = true) => {
            return this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
                const id = this.getValidatedId(req, Object.keys(req.params)[0]);
                const userId = requireAuth ? this.ensureAuthenticated(req) : undefined;
                yield service(id, userId);
                (0, response_utils_1.sendSuccess)(res, message);
            }));
        };
    }
    /**
     * Ensure user is authenticated
     */
    ensureAuthenticated(req) {
        var _a;
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            throw (0, errorHandler_1.createError)('Unauthorized', 401);
        }
        return req.user.id;
    }
    /**
     * Get and validate UUID parameter
     */
    getValidatedId(req, paramName) {
        const id = req.params[paramName];
        (0, validation_utils_1.validateUUID)(id, paramName);
        return id;
    }
}
exports.BaseController = BaseController;
//# sourceMappingURL=controller.utils.js.map