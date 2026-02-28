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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportUsersToCSV = exports.toggleBlockUser = exports.updateVerificationStatus = exports.getUserById = exports.getAllUsers = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
const logger_1 = __importDefault(require("../../config/logger"));
/**
 * Get all users with filtering and pagination
 */
const getAllUsers = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const offset = (page - 1) * limit;
    const where = {};
    if (filters.verificationStatus) {
        where.verificationStatus = filters.verificationStatus;
    }
    if (filters.isBlocked !== undefined) {
        where.isBlocked = filters.isBlocked;
    }
    if (filters.country) {
        where.country = filters.country;
    }
    if (filters.city) {
        where.city = filters.city;
    }
    // Server-side search logic
    if (filters.search) {
        const searchCondition = {
            [sequelize_1.Op.or]: [
                { id: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { firstName: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { lastName: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { email: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { phone: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            ],
        };
        Object.assign(where, searchCondition);
    }
    // Sorting logic
    let order = [['createdAt', 'DESC']];
    if (filters.sortBy) {
        const sortOrder = ((_a = filters.sortOrder) === null || _a === void 0 ? void 0 : _a.toUpperCase()) === 'ASC' ? 'ASC' : 'DESC';
        order = [[filters.sortBy, sortOrder]];
    }
    const { rows: users, count: total } = yield models_1.User.findAndCountAll({
        where,
        attributes: { exclude: ['passwordHash', 'resetPasswordOtp', 'resetPasswordOtpExpires'] },
        include: [
            {
                model: models_1.UserDrivingInfo,
                required: false,
            },
            {
                model: models_1.UserIdentityDocument,
                required: false,
                attributes: {
                    exclude: [
                        'driverLicenseFront',
                        'driverLicenseBack',
                        'passportPhoto',
                        'internationalDrivingPermit',
                        'selfieWithLicense',
                    ],
                },
            },
        ],
        order,
        limit,
        offset,
        distinct: true,
    });
    return {
        users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
});
exports.getAllUsers = getAllUsers;
/**
 * Get single user by ID with full details
 */
const getUserById = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield models_1.User.findByPk(userId, {
        attributes: { exclude: ['passwordHash', 'resetPasswordOtp', 'resetPasswordOtpExpires'] },
        include: [
            {
                model: models_1.UserDrivingInfo,
                required: false,
            },
            {
                model: models_1.UserIdentityDocument,
                required: false,
            },
            {
                model: models_1.Booking,
                required: false,
                limit: 10,
                order: [['createdAt', 'DESC']],
                attributes: ['id', 'bookingStatus', 'paymentStatus', 'bookingType', 'startDatetime', 'createdAt'],
            },
        ],
    });
});
exports.getUserById = getUserById;
/**
 * Update user verification status
 */
const updateVerificationStatus = (userId, verificationStatus) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = Date.now();
    logger_1.default.info('Updating user verification status', { userId, verificationStatus });
    const transaction = yield models_1.sequelize.transaction();
    try {
        const user = yield models_1.User.findByPk(userId, {
            transaction,
            lock: true,
        });
        if (!user) {
            logger_1.default.error('User not found for verification status update', { userId });
            throw new Error('User not found');
        }
        yield user.update({
            verificationStatus,
            verificationDate: verificationStatus === 'VERIFIED' ? new Date() : null,
        }, { transaction });
        // Also update identity document verification status if exists
        const identityDoc = yield models_1.UserIdentityDocument.findOne({
            where: { userId },
            transaction,
        });
        if (identityDoc) {
            yield identityDoc.update({
                verificationStatus,
                verificationDate: verificationStatus === 'VERIFIED' ? new Date() : null,
                verified: verificationStatus === 'VERIFIED',
            }, { transaction });
        }
        yield transaction.commit();
        const duration = Date.now() - startTime;
        logger_1.default.info('User verification status updated successfully', {
            userId,
            verificationStatus,
            duration: `${duration}ms`,
        });
        return user;
    }
    catch (error) {
        yield transaction.rollback();
        logger_1.default.error('Failed to update user verification status, transaction rolled back', {
            userId,
            verificationStatus,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
});
exports.updateVerificationStatus = updateVerificationStatus;
/**
 * Block or unblock a user
 */
const toggleBlockUser = (userId, isBlocked, reason) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = Date.now();
    logger_1.default.info('Toggling user block status', { userId, isBlocked, reason });
    const transaction = yield models_1.sequelize.transaction();
    try {
        const user = yield models_1.User.findByPk(userId, {
            transaction,
            lock: true,
        });
        if (!user) {
            logger_1.default.error('User not found for block status update', { userId });
            throw new Error('User not found');
        }
        yield user.update({ isBlocked }, { transaction });
        // If blocking user, cancel all their pending bookings
        if (isBlocked) {
            logger_1.default.debug('Cancelling pending bookings for blocked user', { userId });
            yield models_1.Booking.update({
                bookingStatus: 'CANCELLED',
                notes: models_1.sequelize.literal(`CONCAT(COALESCE(notes, ''), '\nCancelled: User blocked${reason ? ` - ${reason}` : ''}')`),
            }, {
                where: {
                    userId,
                    bookingStatus: { [sequelize_1.Op.in]: ['PENDING', 'CONFIRMED'] },
                },
                transaction,
            });
        }
        yield transaction.commit();
        const duration = Date.now() - startTime;
        logger_1.default.info('User block status updated successfully', {
            userId,
            isBlocked,
            duration: `${duration}ms`,
        });
        return user;
    }
    catch (error) {
        yield transaction.rollback();
        logger_1.default.error('Failed to update user block status, transaction rolled back', {
            userId,
            isBlocked,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
});
exports.toggleBlockUser = toggleBlockUser;
/**
 * Export users to CSV with filters
 */
const exportUsersToCSV = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    const where = {};
    if (filters.verificationStatus) {
        where.verificationStatus = filters.verificationStatus;
    }
    if (filters.isBlocked !== undefined) {
        where.isBlocked = filters.isBlocked;
    }
    if (filters.country) {
        where.country = filters.country;
    }
    if (filters.city) {
        where.city = filters.city;
    }
    if (filters.search) {
        const searchCondition = {
            [sequelize_1.Op.or]: [
                { id: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { firstName: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { lastName: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { email: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { phone: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            ],
        };
        Object.assign(where, searchCondition);
    }
    const users = yield models_1.User.findAll({
        where,
        attributes: { exclude: ['passwordHash', 'resetPasswordOtp', 'resetPasswordOtpExpires'] },
        order: [['createdAt', 'DESC']],
        limit: 5000,
    });
    return users;
});
exports.exportUsersToCSV = exportUsersToCSV;
//# sourceMappingURL=user.service.js.map