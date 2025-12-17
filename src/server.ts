import './config/env/envConfig';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { initPostgres_DB, sequelize } from './models';
import { configPassport } from './config/passport';
import routes from './routes';
import { securityHeaders, sanitizeInput, preventParameterPollution } from './services/middleware/security';
import { startTokenCleanupJob } from './services/cleanup/tokenCleanup.service';
import { errorHandler, notFoundHandler } from './services/middleware/errorHandler';

const server = express();
const PORT = process.env.PORT;

// Security middleware
server.use(securityHeaders);
server.use(preventParameterPollution);

// Configure CORS
server.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
}));

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
  console.log(`Server is running on port ${PORT}`);
});

(async () => {
  try {
    initPostgres_DB();
    await sequelize.sync();
    
    // Start token cleanup job
    startTokenCleanupJob();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.log('Failed to initialize database', error);
    process.exit(1);
  }
})();
