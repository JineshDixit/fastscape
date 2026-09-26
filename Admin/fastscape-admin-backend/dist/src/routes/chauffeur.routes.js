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
const chauffeurController = __importStar(require("../controllers/chauffeur/chauffeur.controller"));
const authenticateUser_1 = require("../services/middleware/authenticateUser");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(authenticateUser_1.authenticateUser);
/**
 * GET /api/chauffeurs/export
 * Export chauffeurs to CSV with filters
 * Query params: status, isVerified, minRating, city, experienceLevel, nationality, search
 * Must be before /:id route to avoid route conflict
 */
router.get('/export', chauffeurController.exportChauffeurs);
/**
 * GET /api/chauffeurs
 * Get all chauffeurs with filters
 * Query params: status, isVerified, minRating, city, page, limit
 */
router.get('/', chauffeurController.getAllChauffeurs);
/**
 * GET /api/chauffeurs/:id
 * Get single chauffeur with booking history and performance metrics
 */
router.get('/:id', chauffeurController.getChauffeurById);
/**
 * PUT /api/chauffeurs/:id/verify
 * Mark chauffeur as verified
 */
router.put('/:id/verify', chauffeurController.verifyChauffeur);
/**
 * PUT /api/chauffeurs/:id/status
 * Update chauffeur status
 * Body: { status: string } (AVAILABLE, BUSY, OFF_DUTY, ON_BREAK)
 */
router.put('/:id/status', chauffeurController.updateChauffeurStatus);
/**
 * POST /api/chauffeurs
 * Create a new chauffeur
 */
router.post('/', chauffeurController.createChauffeur);
/**
 * PUT /api/chauffeurs/:id
 * Update chauffeur details
 */
router.put('/:id', chauffeurController.updateChauffeur);
/**
 * DELETE /api/chauffeurs/:id
 * Delete (Soft Delete) a chauffeur
 */
router.delete('/:id', chauffeurController.deleteChauffeur);
exports.default = router;
//# sourceMappingURL=chauffeur.routes.js.map