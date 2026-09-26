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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBookingEligibility = exports.getLocationStatistics = exports.getUsersByLocation = exports.createUser = exports.deleteUser = exports.updateUser = exports.getUserByEmail = exports.getUserProfile = exports.getUserById = exports.validateAndNormalizeAddress = void 0;
const models_1 = require("../../models");
const file_utils_1 = require("../../utils/file.utils");
const errorHandler_1 = require("../middleware/errorHandler");
const password_utils_1 = require("../../utils/password.utils");
const security_utils_1 = require("../../utils/security.utils");
const validation_utils_1 = require("../../utils/validation.utils");
const database_utils_1 = require("../../utils/database.utils");
const sequelize_1 = require("sequelize");
const logger_1 = __importDefault(require("../../utils/logger"));
const verificationConfig_1 = require("../../config/verification/verificationConfig");
/**
 * Validate and normalize address data
 */
const validateAndNormalizeAddress = (data) => {
    if (data.city)
        data.city = data.city.trim();
    if (data.state)
        data.state = data.state.trim();
    if (data.zipCode)
        data.zipCode = data.zipCode.trim().toUpperCase();
    if (data.country)
        data.country = data.country.trim();
};
exports.validateAndNormalizeAddress = validateAndNormalizeAddress;
/**
 * Helper function to determine address completeness
 */
function getAddressCompleteness(user) {
    const hasCity = !!user.city;
    const hasState = !!user.state;
    const hasCountry = !!user.country;
    if (hasCity && hasState && hasCountry) {
        return 'COMPLETE';
    }
    else if (hasCity || hasState || hasCountry) {
        return 'PARTIAL';
    }
    else {
        return 'MISSING';
    }
}
/**
 * Retrieves a user by ID (excluding password hash)
 */
const getUserById = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw (0, errorHandler_1.createError)('User ID is required', 400);
    }
    const user = yield models_1.User.findByPk(userId, {
        attributes: database_utils_1.USER_SAFE_ATTRIBUTES,
    });
    if (!user) {
        throw (0, errorHandler_1.createError)('User not found', 404);
    }
    return user.toJSON();
});
exports.getUserById = getUserById;
/**
 * Retrieves complete user profile including driving info and documents
 */
const getUserProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw (0, errorHandler_1.createError)('User ID is required', 400);
    }
    const user = yield models_1.User.findByPk(userId, {
        attributes: database_utils_1.USER_SAFE_ATTRIBUTES,
        include: [
            {
                model: models_1.UserDrivingInfo,
                as: 'drivingInfo',
                required: false,
            },
            {
                model: models_1.UserIdentityDocument,
                as: 'identityDocument',
                required: false,
            },
        ],
    });
    if (!user) {
        throw (0, errorHandler_1.createError)('User not found', 404);
    }
    const userJson = user.toJSON();
    // Flatten the structure for frontend compatibility
    if (userJson.drivingInfo) {
        userJson.licenseIssuingCountry = userJson.drivingInfo.licenseIssuingCountry;
        userJson.licenseExpiryDate = userJson.drivingInfo.licenseExpiryDate;
        userJson.drivingExperienceYears = userJson.drivingInfo.drivingExperienceYears;
        userJson.visaStatus = userJson.drivingInfo.visaStatus;
    }
    if (userJson.identityDocument) {
        userJson.driverLicenseFront = userJson.identityDocument.driverLicenseFront;
        userJson.driverLicenseBack = userJson.identityDocument.driverLicenseBack;
        userJson.passportPhoto = userJson.identityDocument.passportPhoto;
        userJson.internationalDrivingPermit = userJson.identityDocument.internationalDrivingPermit;
        userJson.selfieWithLicense = userJson.identityDocument.selfieWithLicense;
        userJson.documentVerificationStatus = userJson.identityDocument.verificationStatus;
        userJson.documentVerified = userJson.identityDocument.verified;
    }
    // Clean up nested objects
    delete userJson.drivingInfo;
    delete userJson.identityDocument;
    return userJson;
});
exports.getUserProfile = getUserProfile;
/**
 * Retrieves a user by email
 */
const getUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    if (!email) {
        throw (0, errorHandler_1.createError)('Email is required', 400);
    }
    const sanitizedEmail = (0, security_utils_1.sanitizeEmail)(email);
    return yield models_1.User.findOne({ where: { email: sanitizedEmail } });
});
exports.getUserByEmail = getUserByEmail;
/**
 * Updates a user by ID with the provided data, including driving info and documents
 */
const updateUser = (userId, updateData, files) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw (0, errorHandler_1.createError)('User ID is required', 400);
    }
    // Find user first
    const user = yield models_1.User.findByPk(userId);
    if (!user) {
        throw (0, errorHandler_1.createError)('User not found', 404);
    }
    // Sanitize and validate email if provided
    if (updateData.email) {
        (0, validation_utils_1.validateEmail)(updateData.email);
        updateData.email = (0, security_utils_1.sanitizeEmail)(updateData.email);
        // Check if email is already taken by another user
        const existingUser = yield models_1.User.findOne({
            where: {
                email: updateData.email,
                id: { [sequelize_1.Op.ne]: userId },
            },
        });
        if (existingUser) {
            throw (0, errorHandler_1.createError)('Email is already taken', 409);
        }
    }
    // Normalize address fields if present
    (0, exports.validateAndNormalizeAddress)(updateData);
    // Hash password if provided
    if (updateData.passwordHash) {
        updateData.passwordHash = yield (0, password_utils_1.hashPassword)(updateData.passwordHash);
    }
    // Remove sensitive fields that shouldn't be updated directly
    const { id } = updateData, safeUpdateData = __rest(updateData, ["id"]);
    // Transaction for atomic updates
    const transaction = yield models_1.User.sequelize.transaction();
    try {
        logger_1.default.info('Initiating user profile update', { userId });
        // 1. Update User basic info
        yield user.update(safeUpdateData, { transaction });
        // 2. Update Driving Info
        if (updateData.licenseIssuingCountry ||
            updateData.licenseExpiryDate ||
            updateData.drivingExperienceYears ||
            updateData.visaStatus) {
            logger_1.default.info('Updating user driving information', { userId });
            const drivingInfoData = {
                userId,
                licenseIssuingCountry: updateData.licenseIssuingCountry,
                licenseExpiryDate: updateData.licenseExpiryDate,
                drivingExperienceYears: updateData.drivingExperienceYears,
                visaStatus: updateData.visaStatus,
            };
            // Upsert driving info
            const existingDrivingInfo = yield models_1.UserDrivingInfo.findOne({ where: { userId }, transaction });
            if (existingDrivingInfo) {
                yield existingDrivingInfo.update(drivingInfoData, { transaction });
            }
            else {
                yield models_1.UserDrivingInfo.create(drivingInfoData, { transaction });
            }
        }
        // 3. Update Identity Documents (if files provided)
        if (files && Object.keys(files).length > 0) {
            logger_1.default.info('Processing user document uploads', { userId, fileCount: Object.keys(files).length });
            const documentUpdates = {
                verificationStatus: 'PENDING', // Reset verification when new docs arrive
                verified: false,
            };
            // Helper to process file
            const processFile = (fieldName) => __awaiter(void 0, void 0, void 0, function* () {
                if (files[fieldName] && files[fieldName][0]) {
                    const relativePath = yield (0, file_utils_1.saveFile)(files[fieldName][0], userId, fieldName);
                    documentUpdates[fieldName] = relativePath;
                }
            });
            yield processFile('driverLicenseFront');
            yield processFile('driverLicenseBack');
            yield processFile('passportPhoto');
            yield processFile('internationalDrivingPermit');
            yield processFile('selfieWithLicense');
            if (Object.keys(documentUpdates).length > 2) {
                // More than just status/verified
                // Upsert identity documents
                const existingDocs = yield models_1.UserIdentityDocument.findOne({ where: { userId }, transaction });
                // Check if auto-verification is enabled
                const shouldAutoVerify = verificationConfig_1.verificationConfig.autoVerifyDocuments;
                if (shouldAutoVerify) {
                    logger_1.default.info('Auto-verifying documents (enabled in config)', { userId });
                    documentUpdates.verificationStatus = 'VERIFIED';
                    documentUpdates.verified = true;
                    yield user.update({ verificationStatus: 'VERIFIED' }, { transaction });
                }
                else {
                    logger_1.default.info('Documents uploaded - pending manual verification', { userId });
                    // Keep as PENDING - admin will verify later
                }
                if (existingDocs) {
                    yield existingDocs.update(documentUpdates, { transaction });
                }
                else {
                    yield models_1.UserIdentityDocument.create(Object.assign({ userId }, documentUpdates), { transaction });
                }
                logger_1.default.info(`User documents updated ${shouldAutoVerify ? 'and AUTO-VERIFIED' : '- PENDING verification'}`, {
                    userId,
                });
            }
        }
        yield transaction.commit();
        logger_1.default.info('User profile update completed successfully', { userId });
        // Return updated user without password
        const finalUser = yield models_1.User.findByPk(userId, {
            attributes: database_utils_1.USER_SAFE_ATTRIBUTES,
        });
        return finalUser.toJSON();
    }
    catch (error) {
        yield transaction.rollback();
        logger_1.default.error('Error updating user profile', { userId, error: error.message });
        throw error;
    }
});
exports.updateUser = updateUser;
/**
 * Deletes a user by ID
 */
const deleteUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw (0, errorHandler_1.createError)('User ID is required', 400);
    }
    const user = yield models_1.User.findByPk(userId);
    if (!user) {
        throw (0, errorHandler_1.createError)('User not found', 404);
    }
    // Revoke all refresh tokens before deleting user
    yield models_1.RefreshToken.update({ isRevoked: true }, { where: { userId, isRevoked: false } });
    // Delete user
    yield user.destroy();
});
exports.deleteUser = deleteUser;
/**
 * Creates a new user
 */
const createUser = (userData) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, dateOfBirth, nationality, email: rawEmail, phone, passwordHash } = userData;
    // Validate required fields
    (0, validation_utils_1.validateRequiredFields)(userData, [
        'firstName',
        'lastName',
        'dateOfBirth',
        'nationality',
        'email',
        'phone',
        'passwordHash',
    ]);
    const email = (0, security_utils_1.sanitizeEmail)(rawEmail);
    (0, validation_utils_1.validateEmail)(email);
    // Check if user already exists
    const existingUser = yield models_1.User.findOne({ where: { email } });
    if (existingUser) {
        throw (0, errorHandler_1.createError)('User with this email already exists', 409);
    }
    // Hash password
    const hashedPassword = yield (0, password_utils_1.hashPassword)(passwordHash);
    // Create user
    const user = yield models_1.User.create({
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        nationality,
        email,
        phone,
        passwordHash: hashedPassword,
        isBlocked: false,
    });
    // Return user without password
    const _a = user.toJSON(), { passwordHash: _ } = _a, userWithoutPassword = __rest(_a, ["passwordHash"]);
    return userWithoutPassword;
});
exports.createUser = createUser;
/**
 * Get users by location
 */
const getUsersByLocation = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { city, state, country } = query;
    const whereConditions = {
        isBlocked: false,
    };
    if (city) {
        whereConditions.city = { [sequelize_1.Op.iLike]: `%${city}%` };
    }
    if (state) {
        whereConditions.state = { [sequelize_1.Op.iLike]: `%${state}%` };
    }
    if (country) {
        whereConditions.country = { [sequelize_1.Op.iLike]: `%${country}%` };
    }
    const users = yield models_1.User.findAll({
        where: whereConditions,
        attributes: [
            'id',
            'firstName',
            'lastName',
            'email',
            'phone',
            'city',
            'state',
            'zipCode',
            'country',
            'nationality',
            'createdAt',
        ],
        order: [
            ['firstName', 'ASC'],
            ['lastName', 'ASC'],
        ],
    });
    return users.map((user) => (Object.assign(Object.assign({}, user.toJSON()), { locationSummary: [user.city, user.state, user.country].filter(Boolean).join(', '), addressCompleteness: getAddressCompleteness(user) })));
});
exports.getUsersByLocation = getUsersByLocation;
/**
 * Get location statistics
 */
const getLocationStatistics = () => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield models_1.User.findAll({
        attributes: ['country', 'state', 'city', [models_1.User.sequelize.fn('COUNT', models_1.User.sequelize.col('id')), 'userCount']],
        where: {
            isBlocked: false,
        },
        group: ['country', 'state', 'city'],
        order: [[models_1.User.sequelize.fn('COUNT', models_1.User.sequelize.col('id')), 'DESC']],
        raw: true,
    });
    const totalUsers = yield models_1.User.count({ where: { isBlocked: false } });
    const addressCompleteness = yield models_1.User.findAll({
        attributes: [
            [
                models_1.User.sequelize.literal(`
          CASE 
            WHEN city IS NOT NULL AND state IS NOT NULL AND country IS NOT NULL THEN 'COMPLETE'
            WHEN city IS NOT NULL OR state IS NOT NULL OR country IS NOT NULL THEN 'PARTIAL'
            ELSE 'MISSING'
          END
        `),
                'completeness',
            ],
            [models_1.User.sequelize.fn('COUNT', models_1.User.sequelize.col('id')), 'count'],
        ],
        where: {
            isBlocked: false,
        },
        group: [models_1.User.sequelize.literal('completeness')],
        raw: true,
    });
    return {
        totalUsers,
        locationBreakdown: stats,
        addressCompleteness,
    };
});
exports.getLocationStatistics = getLocationStatistics;
/**
 * Check if user can proceed with booking
 */
const checkBookingEligibility = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield models_1.User.findByPk(userId, {
        include: [
            {
                model: models_1.UserIdentityDocument,
                as: 'identityDocument',
                required: false,
            },
            {
                model: models_1.UserDrivingInfo,
                as: 'drivingInfo',
                required: false,
            },
        ],
    });
    if (!user) {
        throw (0, errorHandler_1.createError)('User not found', 404);
    }
    const userJson = user.toJSON();
    // Check if user has driving info
    if (!userJson.drivingInfo) {
        return {
            eligible: false,
            reason: 'Please complete your driving license information first.',
        };
    }
    // Check if user has uploaded documents
    const identityDoc = userJson.identityDocument;
    const missingDocuments = [];
    verificationConfig_1.verificationConfig.requiredDocuments.forEach((doc) => {
        if (!identityDoc || !identityDoc[doc]) {
            missingDocuments.push(doc);
        }
    });
    if (missingDocuments.length > 0) {
        return {
            eligible: false,
            reason: 'Please upload all required identity documents.',
            missingDocuments,
        };
    }
    // Check verification status
    const verificationStatus = (identityDoc === null || identityDoc === void 0 ? void 0 : identityDoc.verificationStatus) || 'PENDING';
    const bookingCheck = (0, verificationConfig_1.canUserBook)(verificationStatus);
    return {
        eligible: bookingCheck.allowed,
        reason: bookingCheck.reason,
        restrictions: bookingCheck.restrictions,
        verificationStatus,
    };
});
exports.checkBookingEligibility = checkBookingEligibility;
//# sourceMappingURL=user.service.js.map