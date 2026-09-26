"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleImageNotFound = exports.serveStaticFiles = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/**
 * Middleware to serve static files with proper headers
 */
const serveStaticFiles = () => {
    const uploadsPath = path_1.default.join(process.cwd(), 'uploads');
    // Ensure uploads directory exists
    if (!fs_1.default.existsSync(uploadsPath)) {
        fs_1.default.mkdirSync(uploadsPath, { recursive: true });
    }
    return express_1.default.static(uploadsPath, {
        maxAge: '1d', // Cache for 1 day
        etag: true,
        lastModified: true,
        setHeaders: (res, filePath) => {
            // Set appropriate content type for images
            const ext = path_1.default.extname(filePath).toLowerCase();
            switch (ext) {
                case '.jpg':
                case '.jpeg':
                    res.setHeader('Content-Type', 'image/jpeg');
                    break;
                case '.png':
                    res.setHeader('Content-Type', 'image/png');
                    break;
                case '.webp':
                    res.setHeader('Content-Type', 'image/webp');
                    break;
                default:
                    res.setHeader('Content-Type', 'application/octet-stream');
            }
            // Set cache control headers
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
        },
    });
};
exports.serveStaticFiles = serveStaticFiles;
/**
 * Middleware to handle image not found
 */
const handleImageNotFound = (req, res, next) => {
    // Only handle requests to uploads path
    if (req.path.startsWith('/uploads/')) {
        return res.status(404).json({
            success: false,
            message: 'Image not found',
        });
    }
    next();
};
exports.handleImageNotFound = handleImageNotFound;
//# sourceMappingURL=staticFiles.js.map