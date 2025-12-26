import './config/env/envConfig';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import {
  preventParameterPollution,
  sanitizeInput,
  securityHeaders,
} from './services/middleware/security';
import { errorHandler, notFoundHandler } from './services/middleware/errorHandler';
import { serveStaticFiles, handleImageNotFound } from './services/middleware/staticFiles';
import { initPostgres_DB } from './models';
import { startTokenCleanupJob } from './services/cleanup/tokenCleanup.service';
import { configPassport } from './config/passport';
import apiRoutes from './routes';

const server = express();
const PORT = process.env.PORT || 3001;

// Security middleware
server.use(securityHeaders);
server.use(preventParameterPollution);

server.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Body parsing middleware
server.use(express.json({ limit: '10mb' }));
server.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
server.use(sanitizeInput);

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

// Handle image not found
server.use(handleImageNotFound);

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
    
    startTokenCleanupJob();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.log('Failed to initialize database', error);
    process.exit(1);
  }
})();
