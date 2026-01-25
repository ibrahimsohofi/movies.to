import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { initializeSocket } from './config/socket.js';

import { validateEnv, getConfig } from './config/envValidation.js';
import { testConnection } from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { applySecurityMiddleware } from './middleware/security.js';
import { initRedis } from './config/redis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/auth.js';
import watchlistRoutes from './routes/watchlist.js';
import reviewRoutes from './routes/reviews.js';
import commentRoutes from './routes/comments.js';
import torrentRoutes from './routes/torrents.js';
import syncRoutes from './routes/sync.js';
import notificationRoutes from './routes/notifications.js';
import userRoutes from './routes/users.js';
import contactRoutes from './routes/contact.js';
import listsRoutes from './routes/lists.js';
import followsRoutes from './routes/follows.js';
import activitiesRoutes from './routes/activities.js';
import recommendationsRoutes from './routes/recommendations.js';
import quizRoutes from './routes/quiz.js';
import subscriptionRoutes from './routes/subscription.js';
import webhooksRoutes from './routes/webhooks.js';
import analyticsRoutes from './routes/analytics.js';
import shareRoutes from './routes/share.js';
import watchPartyRoutes from './routes/watchParty.js';
import pushRoutes from './routes/push.js';
import collaborativeListsRoutes from './routes/collaborativeLists.js';
import cacheRoutes from './routes/cache.js';

// Load and validate environment variables
dotenv.config();
validateEnv();

const config = getConfig();
const app = express();
const PORT = config.port;

// Trust proxy for rate limiting and security
app.set('trust proxy', 1);

// CORS configuration - must be before other middleware
// Support multiple frontend URLs (comma-separated in .env)
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5175' || "http://192.168.0.151:5175/")
  .split(',')
  .map(origin => origin.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In development, allow Same.new preview domains
    if (process.env.NODE_ENV === 'development' && origin) {
      if (origin.includes('.preview.same-app.com') || origin.includes('localhost')) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
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

// Serve uploaded files (avatars, etc.)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Movies.to API is running',
    timestamp: new Date().toISOString()
  });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Movies.to API Documentation',
}));

// Webhooks (must be before body parser middleware)
app.use('/webhooks', webhooksRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/torrents', torrentRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/follows', followsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/watch-party', watchPartyRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/lists', collaborativeListsRoutes);
app.use('/api/cache', cacheRoutes);

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

    // Initialize Redis (optional, falls back gracefully if not available)
    await initRedis();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO
    initializeSocket(httpServer);

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Server started successfully');
      console.log(`📡 API running on: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket server running`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
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
      console.log('   GET  /api/quiz/quizzes');
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
