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
exports.exportChauffeursToCSV = exports.deleteChauffeur = exports.updateChauffeur = exports.createChauffeur = exports.updateChauffeurStatus = exports.verifyChauffeur = exports.getChauffeurById = exports.getAllChauffeurs = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
/**
 * Get all chauffeurs with filtering and pagination
 */
const getAllChauffeurs = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const offset = (page - 1) * limit;
    const where = {};
    if (filters.status) {
        where.status = filters.status;
    }
    if (filters.isVerified !== undefined) {
        where.isVerified = filters.isVerified;
    }
    if (filters.minRating) {
        where.rating = {
            [sequelize_1.Op.gte]: filters.minRating,
        };
    }
    if (filters.city) {
        where.city = { [sequelize_1.Op.iLike]: `%${filters.city}%` };
    }
    if (filters.experienceLevel) {
        where.experienceLevel = filters.experienceLevel;
    }
    if (filters.nationality) {
        where.nationality = { [sequelize_1.Op.iLike]: `%${filters.nationality}%` };
    }
    // Search across multiple fields
    if (filters.search) {
        where[sequelize_1.Op.or] = [
            { fullName: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { email: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { phone: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { licenseNumber: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { city: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { nationality: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
        ];
    }
    // Sorting logic
    let order = [
        ['rating', 'DESC'],
        ['totalTrips', 'DESC'],
    ];
    if (filters.sortBy) {
        const sortOrder = ((_a = filters.sortOrder) === null || _a === void 0 ? void 0 : _a.toUpperCase()) === 'ASC' ? 'ASC' : 'DESC';
        order = [[filters.sortBy, sortOrder]];
    }
    const { rows: chauffeurs, count: total } = yield models_1.Chauffeur.findAndCountAll({
        where,
        order,
        limit,
        offset,
    });
    return {
        chauffeurs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
});
exports.getAllChauffeurs = getAllChauffeurs;
/**
 * Get single chauffeur by ID with booking history and performance metrics
 */
const getChauffeurById = (chauffeurId) => __awaiter(void 0, void 0, void 0, function* () {
    const chauffeur = yield models_1.Chauffeur.findByPk(chauffeurId);
    if (!chauffeur) {
        throw new Error('Chauffeur not found');
    }
    // Get booking history
    const bookings = yield models_1.Booking.findAll({
        where: { chauffeurId },
        attributes: ['id', 'bookingStatus', 'paymentStatus', 'startDatetime', 'endDatetime', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 20,
    });
    // Get reviews
    const reviews = yield models_1.ChauffeurReview.findAll({
        where: { chauffeurId },
        order: [['createdAt', 'DESC']],
        limit: 10,
    });
    // Calculate performance metrics
    const totalBookings = yield models_1.Booking.count({
        where: { chauffeurId },
    });
    const completedBookings = yield models_1.Booking.count({
        where: {
            chauffeurId,
            bookingStatus: 'COMPLETED',
        },
    });
    const cancelledBookings = yield models_1.Booking.count({
        where: {
            chauffeurId,
            bookingStatus: 'CANCELLED',
        },
    });
    const averageRatings = reviews.length > 0
        ? {
            overall: reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length,
            drivingSkill: reviews.reduce((sum, r) => sum + r.drivingSkillRating, 0) / reviews.length,
            punctuality: reviews.reduce((sum, r) => sum + r.punctualityRating, 0) / reviews.length,
            professionalism: reviews.reduce((sum, r) => sum + r.professionalismRating, 0) / reviews.length,
            vehicleCondition: reviews.reduce((sum, r) => sum + r.vehicleConditionRating, 0) / reviews.length,
            recommendationRate: (reviews.filter((r) => r.wouldRecommend).length / reviews.length) * 100,
        }
        : null;
    return {
        chauffeur,
        bookingHistory: bookings,
        recentReviews: reviews,
        performanceMetrics: {
            totalBookings,
            completedBookings,
            cancelledBookings,
            completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
            cancellationRate: totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0,
            averageRatings,
            totalReviews: reviews.length,
        },
    };
});
exports.getChauffeurById = getChauffeurById;
/**
 * Verify a chauffeur (mark as verified)
 */
const verifyChauffeur = (chauffeurId) => __awaiter(void 0, void 0, void 0, function* () {
    const chauffeur = yield models_1.Chauffeur.findByPk(chauffeurId);
    if (!chauffeur) {
        throw new Error('Chauffeur not found');
    }
    if (chauffeur.isVerified) {
        throw new Error('Chauffeur is already verified');
    }
    yield chauffeur.update({ isVerified: true });
    return chauffeur;
});
exports.verifyChauffeur = verifyChauffeur;
/**
 * Update chauffeur status
 */
const updateChauffeurStatus = (chauffeurId, newStatus) => __awaiter(void 0, void 0, void 0, function* () {
    const validStatuses = ['AVAILABLE', 'BUSY', 'OFF_DUTY', 'ON_BREAK'];
    if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    const chauffeur = yield models_1.Chauffeur.findByPk(chauffeurId);
    if (!chauffeur) {
        throw new Error('Chauffeur not found');
    }
    yield chauffeur.update({
        status: newStatus,
        lastActiveAt: new Date(),
    });
    return chauffeur;
});
exports.updateChauffeurStatus = updateChauffeurStatus;
/**
 * Create a new chauffeur
 */
const createChauffeur = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // Check for existing duplicates
    const existingChauffeur = yield models_1.Chauffeur.findOne({
        where: {
            [sequelize_1.Op.or]: [{ email: data.email }, { phone: data.phone }, { licenseNumber: data.licenseNumber }],
        },
    });
    if (existingChauffeur) {
        if (existingChauffeur.email === data.email)
            throw new Error('Email already executing');
        if (existingChauffeur.phone === data.phone)
            throw new Error('Phone number already exists');
        if (existingChauffeur.licenseNumber === data.licenseNumber)
            throw new Error('License number already exists');
    }
    return yield models_1.Chauffeur.create(Object.assign(Object.assign({}, data), { status: 'AVAILABLE', isVerified: false, rating: 5.0, totalTrips: 0, joinedAt: new Date() }));
});
exports.createChauffeur = createChauffeur;
/**
 * Update chauffeur details
 */
const updateChauffeur = (chauffeurId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const chauffeur = yield models_1.Chauffeur.findByPk(chauffeurId);
    if (!chauffeur) {
        throw new Error('Chauffeur not found');
    }
    // Check for duplicate email, phone, or license if they're being updated
    if (data.email || data.phone || data.licenseNumber) {
        const duplicateConditions = [];
        if (data.email && data.email !== chauffeur.email) {
            duplicateConditions.push({ email: data.email });
        }
        if (data.phone && data.phone !== chauffeur.phone) {
            duplicateConditions.push({ phone: data.phone });
        }
        if (data.licenseNumber && data.licenseNumber !== chauffeur.licenseNumber) {
            duplicateConditions.push({ licenseNumber: data.licenseNumber });
        }
        if (duplicateConditions.length > 0) {
            const existingChauffeur = yield models_1.Chauffeur.findOne({
                where: {
                    [sequelize_1.Op.or]: duplicateConditions,
                    id: { [sequelize_1.Op.ne]: chauffeurId },
                },
            });
            if (existingChauffeur) {
                if (data.email && existingChauffeur.email === data.email)
                    throw new Error('Email already exists');
                if (data.phone && existingChauffeur.phone === data.phone)
                    throw new Error('Phone number already exists');
                if (data.licenseNumber && existingChauffeur.licenseNumber === data.licenseNumber)
                    throw new Error('License number already exists');
            }
        }
    }
    yield chauffeur.update(data);
    return chauffeur;
});
exports.updateChauffeur = updateChauffeur;
/**
 * Delete (Soft Delete) a chauffeur
 * Sets status to OFF_DUTY and isVerified to false
 */
const deleteChauffeur = (chauffeurId) => __awaiter(void 0, void 0, void 0, function* () {
    const chauffeur = yield models_1.Chauffeur.findByPk(chauffeurId);
    if (!chauffeur) {
        throw new Error('Chauffeur not found');
    }
    // Check if active bookings exist?
    // Logic: Allow "deleting" (marking inactive) even if bookings exist, but maybe warn?
    // For now, simple update.
    yield chauffeur.update({
        status: 'OFF_DUTY',
        isVerified: false,
        notes: `${chauffeur.notes || ''}\n[DELETED] Account deactivated by admin on ${new Date().toISOString()}`.trim(),
    });
});
exports.deleteChauffeur = deleteChauffeur;
/**
 * Export chauffeurs to CSV with filters
 */
const exportChauffeursToCSV = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    const where = {};
    if (filters.status) {
        where.status = filters.status;
    }
    if (filters.isVerified !== undefined) {
        where.isVerified = filters.isVerified;
    }
    if (filters.minRating) {
        where.rating = {
            [sequelize_1.Op.gte]: filters.minRating,
        };
    }
    if (filters.city) {
        where.city = { [sequelize_1.Op.iLike]: `%${filters.city}%` };
    }
    if (filters.experienceLevel) {
        where.experienceLevel = filters.experienceLevel;
    }
    if (filters.nationality) {
        where.nationality = { [sequelize_1.Op.iLike]: `%${filters.nationality}%` };
    }
    if (filters.search) {
        where[sequelize_1.Op.or] = [
            { fullName: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { email: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { phone: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { licenseNumber: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { city: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { nationality: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
        ];
    }
    const chauffeurs = yield models_1.Chauffeur.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: 5000,
    });
    return chauffeurs;
});
exports.exportChauffeursToCSV = exportChauffeursToCSV;
//# sourceMappingURL=chauffeur.service.js.map