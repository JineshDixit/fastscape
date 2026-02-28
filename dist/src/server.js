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
// Set timezone to UTC before any other code runs
// This ensures consistent behavior across US and Dubai deployments
process.env.TZ = 'UTC';
require("./config/env/envConfig");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const path_1 = __importDefault(require("path"));
const models_1 = require("./models");
const passport_2 = require("./config/passport");
const routes_1 = __importDefault(require("./routes"));
const security_1 = require("./services/middleware/security");
const tokenCleanup_service_1 = require("./services/cleanup/tokenCleanup.service");
const bookingCleanup_service_1 = require("./services/cleanup/bookingCleanup.service");
const errorHandler_1 = require("./services/middleware/errorHandler");
const logger_1 = __importDefault(require("./utils/logger"));
const httpLogger_1 = __importDefault(require("./services/middleware/httpLogger"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_config_1 = require("./config/swagger/swagger.config");
const server = (0, express_1.default)();
const { PORT } = process.env;
// HTTP Logging
server.use(httpLogger_1.default);
// Security middleware
server.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false,
}));
server.use(security_1.preventParameterPollution);
// Static files
server.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// Performance middleware
server.use((0, compression_1.default)());
// Configure CORS
server.use((0, cors_1.default)({
    origin: (_a = process.env.FRONTEND_URL) === null || _a === void 0 ? void 0 : _a.split(','),
    credentials: true,
    optionsSuccessStatus: 200,
}));
// Body parsing middleware
server.use(express_1.default.json({ limit: '10mb' }));
server.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Input sanitization
server.use(security_1.sanitizeInput);
// Initialize Passport
server.use(passport_1.default.initialize());
(0, passport_2.configPassport)();
// API routes
server.use('/api/v1', routes_1.default);
// Swagger Documentation
const openApiDoc = (0, swagger_config_1.loadOpenApiDocument)();
server.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openApiDoc));
// 404 handler
server.use(errorHandler_1.notFoundHandler);
// Global error handler
server.use(errorHandler_1.errorHandler);
server.listen(PORT, () => {
    logger_1.default.info(`Server is running on port ${PORT}`);
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, models_1.initPostgres_DB)();
        (0, tokenCleanup_service_1.startTokenCleanupJob)();
        (0, bookingCleanup_service_1.scheduleBookingCleanup)();
        logger_1.default.info('Database initialized successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to initialize database');
        process.exit(1);
    }
}))();
//# sourceMappingURL=server.js.map