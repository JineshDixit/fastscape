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
const userController = __importStar(require("../controller/user/User.controller"));
const authenticateUser_1 = require("../services/middleware/authenticateUser");
const validation_1 = require("../services/middleware/validation");
const multerConfig_1 = require("../config/multer/multerConfig");
const router = (0, express_1.Router)();
// Get current user profile
router.get('/profile', authenticateUser_1.authenticateUser, userController.getCurrentUser);
// Update user profile
router.put('/profile', authenticateUser_1.authenticateUser, multerConfig_1.userIdentityDocUpload, validation_1.validateUserUpdate, userController.updateUserProfile);
// Document-related endpoints
router.get('/documents/completeness', authenticateUser_1.authenticateUser, userController.checkDocumentCompleteness);
router.get('/documents/skip-step', authenticateUser_1.authenticateUser, userController.shouldSkipDocumentStep);
router.get('/documents/validate', authenticateUser_1.authenticateUser, userController.validateDocumentForBooking);
router.get('/documents/eligibility', authenticateUser_1.authenticateUser, userController.checkBookingEligibility);
exports.default = router;
//# sourceMappingURL=user.routes.js.map