import './config/env/envConfig';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import helmet from 'helmet';
import compression from 'compression';
import { initPostgres_DB, sequelize } from './models';
import { configPassport } from './config/passport';
import routes from './routes';
import { sanitizeInput, preventParameterPollution } from './services/middleware/security';
import { startTokenCleanupJob } from './services/cleanup/tokenCleanup.service';
import { errorHandler, notFoundHandler } from './services/middleware/errorHandler';
import Logger from './utils/logger';
import httpLogger from './services/middleware/httpLogger';

const server = express();
const PORT = process.env.PORT;

// HTTP Logging
server.use(httpLogger);

// Security middleware
server.use(helmet());
server.use(preventParameterPollution);

// Performance middleware
server.use(compression());

// Configure CORS
server.use(
  cors({
    origin: process.env.FRONTEND_URL?.split(','),
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// Body parsing middleware
server.use(express.json({ limit: '10mb' }));
server.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
server.use(sanitizeInput);

// Initialize Passport
server.use(passport.initialize());
configPassport();

// API routes
server.use('/api/v1', routes);

// 404 handler
server.use(notFoundHandler);

// Global error handler
server.use(errorHandler);

server.listen(PORT, () => {
  Logger.info(`Server is running on port ${PORT}`);
});

(async () => {
  try {
    initPostgres_DB();

    startTokenCleanupJob();

    Logger.info('Database initialized successfully');
  } catch (error) {
    Logger.error('Failed to initialize database');
    process.exit(1);
  }
})();
