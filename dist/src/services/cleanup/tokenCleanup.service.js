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
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Clean up expired and revoked refresh tokens
 */
const cleanupTokens = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const deletedCount = yield models_1.RefreshToken.destroy({
            where: {
                [sequelize_1.Op.or]: [
                    // Expired tokens
                    {
                        expiresAt: {
                            [sequelize_1.Op.lt]: new Date(),
                        },
                    },
                    // Revoked tokens older than 30 days
                    {
                        isRevoked: true,
                        updatedAt: {
                            [sequelize_1.Op.lt]: thirtyDaysAgo,
                        },
                    },
                    // Very old tokens (inactive users)
                    {
                        createdAt: {
                            [sequelize_1.Op.lt]: ninetyDaysAgo,
                        },
                    },
                ],
            },
        });
        if (deletedCount > 0) {
            logger_1.default.info(`Cleaned up ${deletedCount} tokens (expired, revoked, or old)`);
        }
    }
    catch (error) {
        logger_1.default.error('Error cleaning up tokens:', error);
    }
});
exports.cleanupTokens = cleanupTokens;
/**
 * Get token statistics
 */
const getTokenStatistics = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const [total, active, expired, revoked] = yield Promise.all([
            models_1.RefreshToken.count(),
            models_1.RefreshToken.count({
                where: {
                    isRevoked: false,
                    expiresAt: { [sequelize_1.Op.gt]: now },
                },
            }),
            models_1.RefreshToken.count({
                where: {
                    isRevoked: false,
                    expiresAt: { [sequelize_1.Op.lt]: now },
                },
            }),
            models_1.RefreshToken.count({
                where: { isRevoked: true },
            }),
        ]);
        return { total, active, expired, revoked };
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
    // Run cleanup every 4 hours (balance between database load and cleanliness)
    node_cron_1.default.schedule('0 */4 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        const start = Date.now();
        logger_1.default.info('Starting token cleanup job...');
        yield (0, exports.cleanupTokens)();
        const duration = Date.now() - start;
        logger_1.default.info(`Token cleanup job finished in ${duration}ms`);
    }));
    // Log token statistics daily at 1 AM
    node_cron_1.default.schedule('0 1 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        const stats = yield (0, exports.getTokenStatistics)();
        logger_1.default.info('Token Statistics:', stats);
    }));
    logger_1.default.info('Token cleanup jobs scheduled');
};
exports.startTokenCleanupJob = startTokenCleanupJob;
/**
 * Stop all cleanup jobs (for testing or shutdown)
 */
const stopTokenCleanupJob = () => {
    node_cron_1.default.getTasks().forEach((task) => task.stop());
    logger_1.default.info('Token cleanup jobs stopped');
};
exports.stopTokenCleanupJob = stopTokenCleanupJob;
//# sourceMappingURL=tokenCleanup.service.js.map