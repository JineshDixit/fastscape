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
exports.stopTokenCleanupJob = exports.startTokenCleanupJob = exports.getTokenStatistics = exports.cleanupTokens = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
const logger_1 = __importDefault(require("../../config/logger"));
/**
 * Handle individual cleanup tasks to reduce redundancy
 */
const runCleanup = (label, where) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = Date.now();
    try {
        const deletedCount = yield models_1.AdminRefreshToken.destroy({ where });
        const duration = Date.now() - startTime;
        if (deletedCount > 0) {
            logger_1.default.info(`[Cleanup] ${label}: Removed ${deletedCount} tokens in ${duration}ms`);
        }
        else {
            logger_1.default.debug(`[Cleanup] ${label}: No tokens to remove (${duration}ms)`);
        }
    }
    catch (error) {
        logger_1.default.error(`[Cleanup] Error in ${label}:`, error);
    }
});
/**
 * Clean up expired and old revoked refresh tokens (Consolidated)
 */
const cleanupTokens = () => __awaiter(void 0, void 0, void 0, function* () {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    yield runCleanup('Expired/Revoked (30d)', {
        [sequelize_1.Op.or]: [
            { expiresAt: { [sequelize_1.Op.lt]: new Date() } },
            { isRevoked: true, updatedAt: { [sequelize_1.Op.lt]: thirtyDaysAgo } },
            { createdAt: { [sequelize_1.Op.lt]: ninetyDaysAgo } },
        ],
    });
});
exports.cleanupTokens = cleanupTokens;
/**
 * Get token statistics
 */
const getTokenStatistics = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const stats = yield Promise.all([
            models_1.AdminRefreshToken.count(),
            models_1.AdminRefreshToken.count({ where: { isRevoked: false, expiresAt: { [sequelize_1.Op.gt]: now } } }),
            models_1.AdminRefreshToken.count({ where: { isRevoked: false, expiresAt: { [sequelize_1.Op.lt]: now } } }),
            models_1.AdminRefreshToken.count({ where: { isRevoked: true } }),
        ]);
        return { total: stats[0], active: stats[1], expired: stats[2], revoked: stats[3] };
    }
    catch (error) {
        logger_1.default.error('Error getting token statistics:', error);
        return { total: 0, active: 0, expired: 0, revoked: 0 };
    }
});
exports.getTokenStatistics = getTokenStatistics;
/**
 * Start the token cleanup job
 */
const startTokenCleanupJob = () => {
    // Run consolidated cleanup every 4 hours
    node_cron_1.default.schedule('0 */4 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.default.info('Starting scheduled token cleanup job...');
        const startTime = Date.now();
        yield (0, exports.cleanupTokens)();
        const duration = Date.now() - startTime;
        logger_1.default.info(`Token cleanup job completed in ${duration}ms`);
    }));
    // Log token statistics daily at 1 AM
    node_cron_1.default.schedule('0 1 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        const stats = yield (0, exports.getTokenStatistics)();
        logger_1.default.info('Token Statistics:', stats);
    }));
    logger_1.default.info('Token cleanup jobs scheduled (every 4 hours + daily stats at 1 AM)');
};
exports.startTokenCleanupJob = startTokenCleanupJob;
/**
 * Stop all cleanup jobs
 */
const stopTokenCleanupJob = () => {
    node_cron_1.default.getTasks().forEach((task) => task.stop());
    logger_1.default.info('Token cleanup jobs stopped');
};
exports.stopTokenCleanupJob = stopTokenCleanupJob;
//# sourceMappingURL=tokenCleanup.service.js.map