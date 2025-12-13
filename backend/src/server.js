import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';

import { validateEnv, getConfig } from './config/envValidation.js';
import { testConnection } from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { applySecurityMiddleware } from './middleware/security.js';

// Import routes
import authRoutes from './routes/auth.js';
import watchlistRoutes from './routes/watchlist.js';
import reviewRoutes from './routes/reviews.js';
import commentRoutes from './routes/comments.js';
import torrentRoutes from './routes/torrents.js';
import syncRoutes from './routes/sync.js';
import notificationRoutes from './routes/notifications.js';
import userRoutes from './routes/users.js';

// Load and validate environment variables
dotenv.config();
validateEnv();

const config = getConfig();
const app = express();
const PORT = config.port;

// Trust proxy for rate limiting and security
app.set('trust proxy', 1);

// CORS configuration - must be before other middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Initialize Passport
app.use(passport.initialize());

// Apply comprehensive security middleware
applySecurityMiddleware(app);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Movies.to API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/torrents', torrentRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('⚠️  Server starting without database connection');
      console.log('💡 Run: cd backend && bun run db:setup');
      console.log('   to setup the database\n');
    }

    app.listen(PORT, () => {
      console.log('🚀 Server started successfully');
      console.log(`📡 API running on: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log('\n📚 Available endpoints:');
      console.log('   GET  /health');
      console.log('   POST /api/auth/register');
      console.log('   POST /api/auth/login');
      console.log('   GET  /api/auth/me');
      console.log('   GET  /api/watchlist');
      console.log('   POST /api/watchlist');
      console.log('   GET  /api/reviews/movie/:tmdb_id');
      console.log('   GET  /api/comments/movie/:tmdb_id');
      console.log('   GET  /api/torrents/imdb/:imdb_id');
      console.log('   GET  /api/sync/movie/:tmdb_id');
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
