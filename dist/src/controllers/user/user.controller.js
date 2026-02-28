"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.exportUsers = exports.toggleBlockUser = exports.updateVerificationStatus = exports.getUserById = exports.getAllUsers = void 0;
const userService = __importStar(require("../../services/user/user.service"));
/**
 * GET /api/users
 * Get all users with filters and pagination
 */
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filters = {
            verificationStatus: req.query.verificationStatus,
            isBlocked: req.query.isBlocked === 'true' ? true : req.query.isBlocked === 'false' ? false : undefined,
            country: req.query.country,
            city: req.query.city,
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            search: req.query.search,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder || 'DESC',
        };
        const result = yield userService.getAllUsers(filters);
        res.status(200).json({
            success: true,
            data: result.users,
            pagination: result.pagination,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch users',
                code: 'USER_FETCH_ERROR',
            },
        });
    }
});
exports.getAllUsers = getAllUsers;
/**
 * GET /api/users/:id
 * Get single user details
 */
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield userService.getUserById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND',
                },
            });
        }
        res.status(200).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch user',
                code: 'USER_FETCH_ERROR',
            },
        });
    }
});
exports.getUserById = getUserById;
/**
 * PUT /api/users/:id/verification-status
 * Update user verification status
 */
const updateVerificationStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { verificationStatus } = req.body;
        if (!verificationStatus) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'verificationStatus is required',
                    code: 'MISSING_STATUS',
                },
            });
        }
        const validStatuses = ['PENDING', 'VERIFIED', 'REJECTED'];
        if (!validStatuses.includes(verificationStatus)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
                    code: 'INVALID_STATUS',
                },
            });
        }
        const user = yield userService.updateVerificationStatus(id, verificationStatus);
        res.status(200).json({
            success: true,
            data: user,
            message: `User verification status updated to ${verificationStatus}`,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to update verification status',
                code: 'STATUS_UPDATE_ERROR',
            },
        });
    }
});
exports.updateVerificationStatus = updateVerificationStatus;
/**
 * PUT /api/users/:id/block
 * Block or unblock a user
 */
const toggleBlockUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { isBlocked, reason } = req.body;
        if (typeof isBlocked !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'isBlocked must be a boolean value',
                    code: 'INVALID_BLOCK_STATUS',
                },
            });
        }
        const user = yield userService.toggleBlockUser(id, isBlocked, reason);
        res.status(200).json({
            success: true,
            data: user,
            message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to update block status',
                code: 'BLOCK_UPDATE_ERROR',
            },
        });
    }
});
exports.toggleBlockUser = toggleBlockUser;
/**
 * GET /api/users/export
 * Export users (clients) to CSV with filters
 */
const exportUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { CSVExportService } = yield Promise.resolve().then(() => __importStar(require('../../services/csv/csvExport.service')));
        const filters = {
            verificationStatus: req.query.verificationStatus,
            isBlocked: req.query.isBlocked === 'true' ? true : req.query.isBlocked === 'false' ? false : undefined,
            country: req.query.country,
            city: req.query.city,
            search: req.query.search,
        };
        const users = yield userService.exportUsersToCSV(filters);
        const columns = [
            { key: 'id', label: 'ID' },
            { key: 'firstName', label: 'First Name' },
            { key: 'lastName', label: 'Last Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'verificationStatus', label: 'Verification Status' },
            {
                key: 'isBlocked',
                label: 'Blocked',
                format: CSVExportService.formatBoolean,
            },
            {
                key: 'dateOfBirth',
                label: 'Date of Birth',
                format: CSVExportService.formatDate,
            },
            { key: 'nationality', label: 'Nationality' },
            { key: 'city', label: 'City' },
            { key: 'country', label: 'Country' },
            { key: 'address', label: 'Address' },
            {
                key: 'createdAt',
                label: 'Created At',
                format: CSVExportService.formatDateTime,
            },
        ];
        const csv = CSVExportService.generateCSV(users, columns);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=clients-${Date.now()}.csv`);
        res.status(200).send(csv);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to export clients',
                code: 'EXPORT_ERROR',
            },
        });
    }
});
exports.exportUsers = exportUsers;
//# sourceMappingURL=user.controller.js.map