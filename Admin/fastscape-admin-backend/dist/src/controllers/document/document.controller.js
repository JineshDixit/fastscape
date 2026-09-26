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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectDocuments = exports.verifyDocuments = exports.getUserDocuments = exports.getPendingDocuments = void 0;
const documentService = __importStar(require("../../services/document/document.service"));
const logger_1 = __importDefault(require("../../config/logger"));
/**
 * GET /api/documents/pending
 * Get all users with PENDING document verification
 */
const getPendingDocuments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const documents = yield documentService.getPendingDocuments();
        res.status(200).json({
            success: true,
            data: documents,
            count: documents.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch pending documents',
                code: 'DOCUMENT_FETCH_ERROR',
            },
        });
    }
});
exports.getPendingDocuments = getPendingDocuments;
/**
 * GET /api/documents/user/:userId
 * Get user's identity documents
 */
const getUserDocuments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const document = yield documentService.getUserDocuments(userId);
        if (!document) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'No documents found for this user',
                    code: 'DOCUMENT_NOT_FOUND',
                },
            });
        }
        res.status(200).json({
            success: true,
            data: document,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch user documents',
                code: 'DOCUMENT_FETCH_ERROR',
            },
        });
    }
});
exports.getUserDocuments = getUserDocuments;
/**
 * PUT /api/documents/:id/verify
 * Verify (approve) user documents
 */
const verifyDocuments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        logger_1.default.info(`Verifying documents for user identity document ${id}`, { notes });
        const document = yield documentService.verifyDocuments(id, notes);
        logger_1.default.info(`Documents verified successfully for user identity document ${id}`, {
            userId: document.userId,
            verificationStatus: document.verificationStatus,
        });
        res.status(200).json({
            success: true,
            data: document,
            message: 'Documents verified successfully',
        });
    }
    catch (error) {
        logger_1.default.error(`Failed to verify documents for identity document ${req.params.id}`, {
            error: error.message,
            stack: error.stack,
        });
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to verify documents',
                code: 'VERIFICATION_ERROR',
            },
        });
    }
});
exports.verifyDocuments = verifyDocuments;
/**
 * PUT /api/documents/:id/reject
 * Reject user documents
 */
const rejectDocuments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;
        if (!rejectionReason) {
            logger_1.default.warn(`Document rejection attempted without reason for identity document ${id}`);
            return res.status(400).json({
                success: false,
                error: {
                    message: 'rejectionReason is required',
                    code: 'MISSING_REASON',
                },
            });
        }
        logger_1.default.info(`Rejecting documents for user identity document ${id}`, { rejectionReason });
        const document = yield documentService.rejectDocuments(id, rejectionReason);
        logger_1.default.info(`Documents rejected successfully for user identity document ${id}`, {
            userId: document.userId,
            verificationStatus: document.verificationStatus,
            rejectionReason,
        });
        res.status(200).json({
            success: true,
            data: document,
            message: 'Documents rejected successfully',
        });
    }
    catch (error) {
        logger_1.default.error(`Failed to reject documents for identity document ${req.params.id}`, {
            error: error.message,
            stack: error.stack,
        });
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to reject documents',
                code: 'REJECTION_ERROR',
            },
        });
    }
});
exports.rejectDocuments = rejectDocuments;
//# sourceMappingURL=document.controller.js.map