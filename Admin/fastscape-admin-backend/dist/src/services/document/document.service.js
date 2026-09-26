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
exports.rejectDocuments = exports.verifyDocuments = exports.getUserDocuments = exports.getPendingDocuments = void 0;
const models_1 = require("../../models");
const logger_1 = __importDefault(require("../../config/logger"));
/**
 * Get all users with PENDING document verification
 */
const getPendingDocuments = () => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = Date.now();
    logger_1.default.debug('Fetching pending documents for verification');
    const documents = yield models_1.UserIdentityDocument.findAll({
        where: {
            verificationStatus: 'PENDING',
        },
        include: [
            {
                model: models_1.User,
                attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'verificationStatus'],
            },
        ],
        order: [['createdAt', 'ASC']],
    });
    const duration = Date.now() - startTime;
    logger_1.default.info('Pending documents retrieved', {
        count: documents.length,
        duration: `${duration}ms`,
    });
    return documents;
});
exports.getPendingDocuments = getPendingDocuments;
/**
 * Get user's identity documents
 */
const getUserDocuments = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield models_1.UserIdentityDocument.findOne({
        where: { userId },
        include: [
            {
                model: models_1.User,
                attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'verificationStatus'],
            },
        ],
    });
});
exports.getUserDocuments = getUserDocuments;
/**
 * Verify user documents (approve)
 */
const verifyDocuments = (documentId, notes) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = Date.now();
    logger_1.default.info('Starting document verification', { documentId, notes });
    const transaction = yield models_1.sequelize.transaction();
    try {
        const document = yield models_1.UserIdentityDocument.findByPk(documentId, {
            transaction,
            lock: true,
        });
        if (!document) {
            logger_1.default.error('Document not found for verification', { documentId });
            throw new Error('Document not found');
        }
        if (document.verificationStatus === 'VERIFIED') {
            logger_1.default.warn('Document already verified', {
                documentId,
                userId: document.userId,
            });
            throw new Error('Document is already verified');
        }
        logger_1.default.debug('Updating document verification status', {
            documentId,
            userId: document.userId,
            previousStatus: document.verificationStatus,
        });
        // Update document status
        yield document.update({
            verificationStatus: 'VERIFIED',
            verified: true,
            verificationDate: new Date(),
        }, { transaction });
        // Update user's overall verification status
        yield models_1.User.update({
            verificationStatus: 'VERIFIED',
        }, {
            where: { id: document.userId },
            transaction,
        });
        yield transaction.commit();
        const duration = Date.now() - startTime;
        logger_1.default.info('Document verified successfully', {
            documentId,
            userId: document.userId,
            duration: `${duration}ms`,
        });
        return document;
    }
    catch (error) {
        yield transaction.rollback();
        logger_1.default.error('Document verification failed, transaction rolled back', {
            documentId,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
});
exports.verifyDocuments = verifyDocuments;
/**
 * Reject user documents
 */
const rejectDocuments = (documentId, rejectionReason) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = Date.now();
    logger_1.default.info('Starting document rejection', { documentId, rejectionReason });
    const transaction = yield models_1.sequelize.transaction();
    try {
        const document = yield models_1.UserIdentityDocument.findByPk(documentId, {
            transaction,
            lock: true,
        });
        if (!document) {
            logger_1.default.error('Document not found for rejection', { documentId });
            throw new Error('Document not found');
        }
        if (document.verificationStatus === 'REJECTED') {
            logger_1.default.warn('Document already rejected', {
                documentId,
                userId: document.userId,
            });
            throw new Error('Document is already rejected');
        }
        if (!rejectionReason) {
            logger_1.default.warn('Rejection reason missing', { documentId });
            throw new Error('Rejection reason is required');
        }
        logger_1.default.debug('Updating document rejection status', {
            documentId,
            userId: document.userId,
            previousStatus: document.verificationStatus,
            rejectionReason,
        });
        // Update document status
        yield document.update({
            verificationStatus: 'REJECTED',
            verified: false,
            verificationDate: new Date(),
        }, { transaction });
        // Update user's overall verification status
        yield models_1.User.update({
            verificationStatus: 'REJECTED',
        }, {
            where: { id: document.userId },
            transaction,
        });
        yield transaction.commit();
        const duration = Date.now() - startTime;
        logger_1.default.info('Document rejected successfully', {
            documentId,
            userId: document.userId,
            rejectionReason,
            duration: `${duration}ms`,
        });
        return document;
    }
    catch (error) {
        yield transaction.rollback();
        logger_1.default.error('Document rejection failed, transaction rolled back', {
            documentId,
            rejectionReason,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
});
exports.rejectDocuments = rejectDocuments;
//# sourceMappingURL=document.service.js.map