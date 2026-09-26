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
exports.createStandardService = exports.UserScopedService = exports.BaseService = void 0;
const errorHandler_1 = require("../services/middleware/errorHandler");
const validation_utils_1 = require("./validation.utils");
const response_utils_1 = require("./response.utils");
/**
 * Base service class with common CRUD operations
 */
class BaseService {
    constructor(model) {
        this.model = model;
    }
    /**
     * Find by primary key with validation
     */
    findByIdOrThrow(id_1, options_1) {
        return __awaiter(this, arguments, void 0, function* (id, options, errorMessage = 'Record not found') {
            (0, validation_utils_1.validateUUID)(id);
            const record = yield this.model.findByPk(id, options);
            if (!record) {
                throw (0, errorHandler_1.createError)(errorMessage, 404);
            }
            return record;
        });
    }
    /**
     * Find one with validation
     */
    findOneOrThrow(where_1, options_1) {
        return __awaiter(this, arguments, void 0, function* (where, options, errorMessage = 'Record not found') {
            const record = yield this.model.findOne(Object.assign({ where }, options));
            if (!record) {
                throw (0, errorHandler_1.createError)(errorMessage, 404);
            }
            return record;
        });
    }
    /**
     * Check if record exists
     */
    exists(where) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield this.model.count({ where });
            return count > 0;
        });
    }
    /**
     * Create with validation
     */
    createRecord(data, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.create(data, options);
        });
    }
    /**
     * Update with validation
     */
    updateRecord(record, data, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield record.update(data, options);
            return record;
        });
    }
    /**
     * Delete with validation
     */
    deleteRecord(record, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield record.destroy(options);
        });
    }
    /**
     * Find with pagination
     */
    findWithPagination(where, query, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page, limit, offset } = (0, response_utils_1.parsePaginationParams)(query);
            const { count, rows } = yield this.model.findAndCountAll(Object.assign({ where,
                limit,
                offset }, options));
            return {
                items: rows,
                total: count,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            };
        });
    }
    /**
     * Bulk operations
     */
    bulkCreate(records, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.bulkCreate(records, options);
        });
    }
    bulkUpdate(values, where, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.update(values, Object.assign({ where }, options));
        });
    }
    bulkDelete(where, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.destroy(Object.assign({ where }, options));
        });
    }
}
exports.BaseService = BaseService;
/**
 * User-scoped service base class
 */
class UserScopedService extends BaseService {
    /**
     * Find by ID with user scope validation
     */
    findByIdWithUserScope(id_1, userId_1) {
        return __awaiter(this, arguments, void 0, function* (id, userId, userField = 'userId', options, errorMessage = 'Record not found or access denied') {
            (0, validation_utils_1.validateUUID)(id);
            (0, validation_utils_1.validateUUID)(userId, 'User ID');
            const whereCondition = {
                id,
                [userField]: userId
            };
            const record = yield this.model.findOne(Object.assign({ where: whereCondition }, options));
            if (!record) {
                throw (0, errorHandler_1.createError)(errorMessage, 404);
            }
            return record;
        });
    }
    /**
     * Find all with user scope
     */
    findAllWithUserScope(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, userField = 'userId', options) {
            (0, validation_utils_1.validateUUID)(userId, 'User ID');
            const whereCondition = {
                [userField]: userId
            };
            return this.model.findAll(Object.assign({ where: whereCondition }, options));
        });
    }
    /**
     * Update with user scope validation
     */
    updateWithUserScope(id_1, userId_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (id, userId, data, userField = 'userId', options) {
            const record = yield this.findByIdWithUserScope(id, userId, userField);
            return this.updateRecord(record, data, options);
        });
    }
    /**
     * Delete with user scope validation
     */
    deleteWithUserScope(id_1, userId_1) {
        return __awaiter(this, arguments, void 0, function* (id, userId, userField = 'userId', options) {
            const record = yield this.findByIdWithUserScope(id, userId, userField);
            yield this.deleteRecord(record, options);
        });
    }
}
exports.UserScopedService = UserScopedService;
/**
 * Common service patterns
 */
const createStandardService = (model, options = {}) => {
    if (options.userScoped) {
        return new (class extends UserScopedService {
            constructor() {
                super(model);
            }
            getById(id, userId) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (userId) {
                        return this.findByIdWithUserScope(id, userId, options.userField, {
                            include: options.defaultIncludes,
                        });
                    }
                    return this.findByIdOrThrow(id, {
                        include: options.defaultIncludes,
                    });
                });
            }
            getList(filters, userId) {
                return __awaiter(this, void 0, void 0, function* () {
                    const findOptions = {
                        include: options.defaultIncludes,
                        order: options.defaultOrder || [['createdAt', 'DESC']],
                    };
                    if (userId) {
                        return this.findAllWithUserScope(userId, options.userField, findOptions);
                    }
                    return this.model.findAll(findOptions);
                });
            }
            create(data, userId) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (userId) {
                        data[options.userField || 'userId'] = userId;
                    }
                    return this.createRecord(data);
                });
            }
            update(id, data, userId) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (userId) {
                        return this.updateWithUserScope(id, userId, data, options.userField);
                    }
                    const record = yield this.findByIdOrThrow(id);
                    return this.updateRecord(record, data);
                });
            }
            delete(id, userId) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (userId) {
                        return this.deleteWithUserScope(id, userId, options.userField);
                    }
                    const record = yield this.findByIdOrThrow(id);
                    yield this.deleteRecord(record);
                });
            }
        })();
    }
    else {
        return new (class extends BaseService {
            constructor() {
                super(model);
            }
            getById(id) {
                return __awaiter(this, void 0, void 0, function* () {
                    return this.findByIdOrThrow(id, {
                        include: options.defaultIncludes,
                    });
                });
            }
            getList(filters) {
                return __awaiter(this, void 0, void 0, function* () {
                    const findOptions = {
                        include: options.defaultIncludes,
                        order: options.defaultOrder || [['createdAt', 'DESC']],
                    };
                    return this.model.findAll(findOptions);
                });
            }
            create(data) {
                return __awaiter(this, void 0, void 0, function* () {
                    return this.createRecord(data);
                });
            }
            update(id, data) {
                return __awaiter(this, void 0, void 0, function* () {
                    const record = yield this.findByIdOrThrow(id);
                    return this.updateRecord(record, data);
                });
            }
            delete(id) {
                return __awaiter(this, void 0, void 0, function* () {
                    const record = yield this.findByIdOrThrow(id);
                    yield this.deleteRecord(record);
                });
            }
        })();
    }
};
exports.createStandardService = createStandardService;
//# sourceMappingURL=service.utils.js.map