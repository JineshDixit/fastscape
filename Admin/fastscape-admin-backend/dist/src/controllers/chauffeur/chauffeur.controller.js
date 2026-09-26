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
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportChauffeurs = exports.deleteChauffeur = exports.updateChauffeur = exports.createChauffeur = exports.updateChauffeurStatus = exports.verifyChauffeur = exports.getChauffeurById = exports.getAllChauffeurs = void 0;
const chauffeurService = __importStar(require("../../services/chauffeur/chauffeur.service"));
/**
 * GET /api/chauffeurs
 * Get all chauffeurs with filters and pagination
 */
const getAllChauffeurs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filters = {
            status: req.query.status,
            isVerified: req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined,
            minRating: req.query.minRating ? parseFloat(req.query.minRating) : undefined,
            city: req.query.city,
            experienceLevel: req.query.experienceLevel,
            nationality: req.query.nationality,
            search: req.query.search,
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder,
        };
        const result = yield chauffeurService.getAllChauffeurs(filters);
        res.status(200).json({
            success: true,
            data: result.chauffeurs,
            pagination: result.pagination,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch chauffeurs',
                code: 'CHAUFFEUR_FETCH_ERROR',
            },
        });
    }
});
exports.getAllChauffeurs = getAllChauffeurs;
/**
 * GET /api/chauffeurs/:id
 * Get single chauffeur with booking history and performance metrics
 */
const getChauffeurById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield chauffeurService.getChauffeurById(id);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(404).json({
            success: false,
            error: {
                message: error.message || 'Chauffeur not found',
                code: 'CHAUFFEUR_NOT_FOUND',
            },
        });
    }
});
exports.getChauffeurById = getChauffeurById;
/**
 * PUT /api/chauffeurs/:id/verify
 * Mark chauffeur as verified
 */
const verifyChauffeur = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const chauffeur = yield chauffeurService.verifyChauffeur(id);
        res.status(200).json({
            success: true,
            data: chauffeur,
            message: 'Chauffeur verified successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to verify chauffeur',
                code: 'VERIFICATION_ERROR',
            },
        });
    }
});
exports.verifyChauffeur = verifyChauffeur;
/**
 * PUT /api/chauffeurs/:id/status
 * Update chauffeur status
 */
const updateChauffeurStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'status is required',
                    code: 'MISSING_STATUS',
                },
            });
        }
        const chauffeur = yield chauffeurService.updateChauffeurStatus(id, status);
        res.status(200).json({
            success: true,
            data: chauffeur,
            message: `Chauffeur status updated to ${status}`,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to update chauffeur status',
                code: 'STATUS_UPDATE_ERROR',
            },
        });
    }
});
exports.updateChauffeurStatus = updateChauffeurStatus;
/**
 * POST /api/chauffeurs
 * Create a new chauffeur
 */
const createChauffeur = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chauffeur = yield chauffeurService.createChauffeur(req.body);
        res.status(201).json({
            success: true,
            data: chauffeur,
            message: 'Chauffeur created successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to create chauffeur',
                code: 'CREATE_ERROR',
            },
        });
    }
});
exports.createChauffeur = createChauffeur;
/**
 * PUT /api/chauffeurs/:id
 * Update chauffeur details
 */
const updateChauffeur = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const chauffeur = yield chauffeurService.updateChauffeur(id, req.body);
        res.status(200).json({
            success: true,
            data: chauffeur,
            message: 'Chauffeur updated successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to update chauffeur',
                code: 'UPDATE_ERROR',
            },
        });
    }
});
exports.updateChauffeur = updateChauffeur;
/**
 * DELETE /api/chauffeurs/:id
 * Delete (Soft Delete) a chauffeur
 */
const deleteChauffeur = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield chauffeurService.deleteChauffeur(id);
        res.status(200).json({
            success: true,
            message: 'Chauffeur deleted successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to delete chauffeur',
                code: 'DELETE_ERROR',
            },
        });
    }
});
exports.deleteChauffeur = deleteChauffeur;
/**
 * GET /api/chauffeurs/export
 * Export chauffeurs to CSV with filters
 */
const exportChauffeurs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { CSVExportService } = yield Promise.resolve().then(() => __importStar(require('../../services/csv/csvExport.service')));
        const filters = {
            status: req.query.status,
            isVerified: req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined,
            minRating: req.query.minRating ? parseFloat(req.query.minRating) : undefined,
            city: req.query.city,
            experienceLevel: req.query.experienceLevel,
            nationality: req.query.nationality,
            search: req.query.search,
        };
        const chauffeurs = yield chauffeurService.exportChauffeursToCSV(filters);
        const columns = [
            { key: 'id', label: 'ID' },
            { key: 'fullName', label: 'Full Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'status', label: 'Status' },
            {
                key: 'isVerified',
                label: 'Verified',
                format: CSVExportService.formatBoolean,
            },
            { key: 'rating', label: 'Rating' },
            { key: 'totalTrips', label: 'Total Trips' },
            { key: 'nationality', label: 'Nationality' },
            { key: 'licenseNumber', label: 'License Number' },
            {
                key: 'licenseExpiryDate',
                label: 'License Expiry',
                format: CSVExportService.formatDate,
            },
            { key: 'experienceLevel', label: 'Experience Level' },
            { key: 'yearsOfExperience', label: 'Years of Experience' },
            {
                key: 'hourlyRate',
                label: 'Hourly Rate',
                format: (val) => CSVExportService.formatCurrency(val),
            },
            { key: 'city', label: 'City' },
            { key: 'country', label: 'Country' },
            {
                key: 'createdAt',
                label: 'Created At',
                format: CSVExportService.formatDateTime,
            },
        ];
        const csv = CSVExportService.generateCSV(chauffeurs, columns);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=chauffeurs-${Date.now()}.csv`);
        res.status(200).send(csv);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to export chauffeurs',
                code: 'EXPORT_ERROR',
            },
        });
    }
});
exports.exportChauffeurs = exportChauffeurs;
//# sourceMappingURL=chauffeur.controller.js.map