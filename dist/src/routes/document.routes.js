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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documentController = __importStar(require("../controllers/document/document.controller"));
const authenticateUser_1 = require("../services/middleware/authenticateUser");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(authenticateUser_1.authenticateUser);
/**
 * GET /api/documents/pending
 * Get all users with PENDING document verification
 */
router.get('/pending', documentController.getPendingDocuments);
/**
 * GET /api/documents/user/:userId
 * Get user's identity documents
 */
router.get('/user/:userId', documentController.getUserDocuments);
/**
 * PUT /api/documents/:id/verify
 * Verify (approve) user documents
 * Body: { notes?: string }
 */
router.put('/:id/verify', documentController.verifyDocuments);
/**
 * PUT /api/documents/:id/reject
 * Reject user documents
 * Body: { rejectionReason: string }
 */
router.put('/:id/reject', documentController.rejectDocuments);
exports.default = router;
//# sourceMappingURL=document.routes.js.map