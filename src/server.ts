import './config/env/envConfig';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { applySecurityMiddlewares } from './services/middleware/security';
import { errorHandler, notFoundHandler } from './services/middleware/errorHandler';
import { serveStaticFiles, handleImageNotFound } from './services/middleware/staticFiles';
import { initPostgres_DB } from './models';
import { startTokenCleanupJob } from './services/cleanup/tokenCleanup.service';
import { configPassport } from './config/passport';
import apiRoutes from './routes';
import { logger, morganMiddleware } from './config/logger';
import swaggerUi from 'swagger-ui-express';
import { loadOpenApiDocument } from './config/swagger/swagger.config';

const server = express();
const PORT = process.env.PORT || 3001;

// HTTP request logging
server.use(morganMiddleware);

// Security middleware
server.use(applySecurityMiddlewares);

server.use(
  cors({
    origin: process.env.FRONTEND_URL?.split(',') || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// Body parsing middleware
server.use(express.json({ limit: '10mb' }));
server.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Passport for admin authentication
server.use(passport.initialize());
configPassport();

// Serve static files (uploaded images)
server.use('/uploads', serveStaticFiles());

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
server.use('/api', apiRoutes);

// Swagger UI Documentation
try {
  const openApiDoc = loadOpenApiDocument();
  server.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDoc));
  logger.info('Swagger documentation available at /api/docs');
} catch (error) {
  logger.error('Failed to load Swagger documentation', error);
}

// Handle image not found
server.use(handleImageNotFound);

// 404 handler
server.use(notFoundHandler);

// Global error handler
server.use(errorHandler);

server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Log level: ${logger.level}`);
});

(async () => {
  try {
    logger.info('Initializing database connection...');
    initPostgres_DB();

    logger.info('Starting token cleanup job...');
    startTokenCleanupJob();

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database', error);
    process.exit(1);
  }
})();
