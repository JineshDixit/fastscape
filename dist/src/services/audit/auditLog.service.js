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
exports.cleanupOldAuditLogs = exports.getUserAuditLogs = exports.getAuditTrail = exports.logDocumentUpload = exports.logPaymentChange = exports.logBookingChange = exports.createAuditLog = exports.initAuditLogModel = exports.AuditLog = void 0;
const models_1 = require("../../models");
const sequelize_1 = require("sequelize");
const logger_1 = __importDefault(require("../../utils/logger"));
// Audit Log Model
class AuditLog extends sequelize_1.Model {
}
exports.AuditLog = AuditLog;
// Initialize Audit Log Model
const initAuditLogModel = () => {
    AuditLog.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        entityType: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: false,
            validate: {
                isIn: [['booking', 'payment', 'user', 'vehicle', 'document']],
            },
        },
        entityId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
        },
        action: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: false,
            validate: {
                isIn: [['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'PAYMENT_PROCESSED', 'DOCUMENT_UPLOADED']],
            },
        },
        userId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true, // System actions might not have a user
        },
        oldValues: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
        },
        newValues: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
        },
        metadata: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
        },
        ipAddress: {
            type: sequelize_1.DataTypes.STRING(45), // IPv6 compatible
            allowNull: true,
        },
        userAgent: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        timestamp: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    }, {
        sequelize: models_1.sequelize,
        freezeTableName: true,
        timestamps: false, // We use our own timestamp field
        underscored: true,
        tableName: 'audit_logs',
        modelName: 'AuditLog',
        indexes: [
            {
                fields: ['entity_type', 'entity_id'],
            },
            {
                fields: ['user_id'],
            },
            {
                fields: ['timestamp'],
            },
            {
                fields: ['action'],
            },
        ],
    });
};
exports.initAuditLogModel = initAuditLogModel;
/**
 * Create an audit log entry
 */
const createAuditLog = (entry) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield AuditLog.create(Object.assign(Object.assign({}, entry), { timestamp: new Date() }));
    }
    catch (error) {
        // Don't let audit logging failures break the main operation
        logger_1.default.error('Failed to create audit log entry', { error, entry });
    }
});
exports.createAuditLog = createAuditLog;
/**
 * Log booking changes
 */
const logBookingChange = (bookingId, action, userId, oldValues, newValues, metadata) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.createAuditLog)({
        entityType: 'booking',
        entityId: bookingId,
        action,
        userId,
        oldValues,
        newValues,
        metadata,
    });
});
exports.logBookingChange = logBookingChange;
/**
 * Log payment changes
 */
const logPaymentChange = (paymentId, action, userId, oldValues, newValues, metadata) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.createAuditLog)({
        entityType: 'payment',
        entityId: paymentId,
        action,
        userId,
        oldValues,
        newValues,
        metadata,
    });
});
exports.logPaymentChange = logPaymentChange;
/**
 * Log document upload
 */
const logDocumentUpload = (documentId, userId, documentType, filename, metadata) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.createAuditLog)({
        entityType: 'document',
        entityId: documentId,
        action: 'DOCUMENT_UPLOADED',
        userId,
        newValues: {
            documentType,
            filename,
        },
        metadata,
    });
});
exports.logDocumentUpload = logDocumentUpload;
/**
 * Get audit trail for an entity
 */
const getAuditTrail = (entityType_1, entityId_1, ...args_1) => __awaiter(void 0, [entityType_1, entityId_1, ...args_1], void 0, function* (entityType, entityId, limit = 50) {
    return AuditLog.findAll({
        where: {
            entityType,
            entityId,
        },
        order: [['timestamp', 'DESC']],
        limit,
    });
});
exports.getAuditTrail = getAuditTrail;
/**
 * Get audit logs for a user
 */
const getUserAuditLogs = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, limit = 100) {
    return AuditLog.findAll({
        where: {
            userId,
        },
        order: [['timestamp', 'DESC']],
        limit,
    });
});
exports.getUserAuditLogs = getUserAuditLogs;
/**
 * Clean up old audit logs (older than specified days)
 */
const cleanupOldAuditLogs = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (daysToKeep = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const deletedCount = yield AuditLog.destroy({
        where: {
            timestamp: {
                [models_1.sequelize.Op.lt]: cutoffDate,
            },
        },
    });
    logger_1.default.info('Old audit logs cleaned up', { deletedCount, cutoffDate });
    return deletedCount;
});
exports.cleanupOldAuditLogs = cleanupOldAuditLogs;
//# sourceMappingURL=auditLog.service.js.map