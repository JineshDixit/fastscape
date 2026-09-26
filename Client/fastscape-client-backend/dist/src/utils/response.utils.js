"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePaginationParams = exports.calculatePagination = exports.sendNoContent = exports.sendCreated = exports.sendSuccessWithPagination = exports.sendSuccess = void 0;
/**
 * Send success response
 */
const sendSuccess = (res, message, data, statusCode = 200) => {
    const response = Object.assign({ success: true, message }, (data !== undefined && { data }));
    res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
/**
 * Send success response with pagination
 */
const sendSuccessWithPagination = (res, message, data, pagination, statusCode = 200) => {
    const response = {
        success: true,
        message,
        data,
        pagination,
    };
    res.status(statusCode).json(response);
};
exports.sendSuccessWithPagination = sendSuccessWithPagination;
/**
 * Send created response
 */
const sendCreated = (res, message, data) => {
    (0, exports.sendSuccess)(res, message, data, 201);
};
exports.sendCreated = sendCreated;
/**
 * Send no content response
 */
const sendNoContent = (res) => {
    res.status(204).send();
};
exports.sendNoContent = sendNoContent;
/**
 * Calculate pagination metadata
 */
const calculatePagination = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
});
exports.calculatePagination = calculatePagination;
/**
 * Parse pagination parameters from query
 */
const parsePaginationParams = (query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};
exports.parsePaginationParams = parsePaginationParams;
//# sourceMappingURL=response.utils.js.map