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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/env/envConfig");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const security_1 = require("./services/middleware/security");
const errorHandler_1 = require("./services/middleware/errorHandler");
const staticFiles_1 = require("./services/middleware/staticFiles");
const models_1 = require("./models");
const tokenCleanup_service_1 = require("./services/cleanup/tokenCleanup.service");
const passport_2 = require("./config/passport");
const routes_1 = __importDefault(require("./routes"));
const logger_1 = require("./config/logger");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_config_1 = require("./config/swagger/swagger.config");
const server = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// HTTP request logging
server.use(logger_1.morganMiddleware);
// Security middleware
server.use(security_1.applySecurityMiddlewares);
server.use((0, cors_1.default)({
    origin: ((_a = process.env.FRONTEND_URL) === null || _a === void 0 ? void 0 : _a.split(',')) || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200,
}));
// Body parsing middleware
server.use(express_1.default.json({ limit: '10mb' }));
server.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Initialize Passport for admin authentication
server.use(passport_1.default.initialize());
(0, passport_2.configPassport)();
// Serve static files (uploaded images)
server.use('/uploads', (0, staticFiles_1.serveStaticFiles)());
// Health check endpoint
server.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Admin API is healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});
// API routes
server.use('/api', routes_1.default);
// Swagger UI Documentation
try {
    const openApiDoc = (0, swagger_config_1.loadOpenApiDocument)();
    server.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openApiDoc));
    logger_1.logger.info('Swagger documentation available at /api/docs');
}
catch (error) {
    logger_1.logger.error('Failed to load Swagger documentation', error);
}
// Handle image not found
server.use(staticFiles_1.handleImageNotFound);
// 404 handler
server.use(errorHandler_1.notFoundHandler);
// Global error handler
server.use(errorHandler_1.errorHandler);
server.listen(PORT, () => {
    logger_1.logger.info(`Server is running on port ${PORT}`);
    logger_1.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger_1.logger.info(`Log level: ${logger_1.logger.level}`);
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger_1.logger.info('Initializing database connection...');
        (0, models_1.initPostgres_DB)();
        logger_1.logger.info('Starting token cleanup job...');
        (0, tokenCleanup_service_1.startTokenCleanupJob)();
        logger_1.logger.info('Database initialized successfully');
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize database', error);
        process.exit(1);
    }
}))();
//# sourceMappingURL=server.js.map