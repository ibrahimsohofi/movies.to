import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';

/**
 * Content Security Policy configuration
 */
export const cspConfig = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    scriptSrc: [
      "'self'",
      process.env.NODE_ENV === 'development' ? "'unsafe-inline'" : '',
    ].filter(Boolean),
    imgSrc: ["'self'", 'data:', 'https:', 'http:'],
    connectSrc: ["'self'", 'https://api.themoviedb.org'],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
  },
});

/**
 * Request ID middleware for tracking
 */
export const requestId = (req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
};

/**
 * General rate limiter
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later.',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many attempts',
      message: 'Too many failed authentication attempts. Please try again in 15 minutes.',
    });
  },
});

/**
 * Rate limiter for password reset
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: 'Too many password reset attempts, please try again later.',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many attempts',
      message: 'Too many password reset requests. Please try again in 1 hour.',
    });
  },
});

/**
 * CSRF token generation and validation
 */
const csrfTokens = new Map();

export const generateCsrfToken = (req, res, next) => {
  if (req.method === 'GET') {
    const token = crypto.randomBytes(32).toString('hex');
    const sessionId = req.session?.id || req.ip;
    csrfTokens.set(sessionId, token);
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Client needs to read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    });
  }
  next();
};

export const validateCsrfToken = (req, res, next) => {
  // Skip CSRF validation for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const sessionId = req.session?.id || req.ip;
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const storedToken = csrfTokens.get(sessionId);

  if (!token || !storedToken || token !== storedToken) {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'CSRF validation failed',
    });
  }

  next();
};

/**
 * Sanitize user input to prevent NoSQL injection
 */
export const sanitizeInput = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized potentially malicious input: ${key}`);
  },
});

/**
 * XSS protection middleware
 */
export const xssProtection = xss();

/**
 * HTTP Parameter Pollution protection
 */
export const hppProtection = hpp({
  whitelist: ['sort', 'filter', 'page', 'limit'], // Allow these parameters to appear multiple times
});

/**
 * Secure headers configuration
 */
export const secureHeaders = [
  helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  }),
  helmet.noSniff(),
  helmet.frameguard({ action: 'deny' }),
  helmet.xssFilter(),
  helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }),
  helmet.hidePoweredBy(),
];

/**
 * Input validation sanitizer
 */
export const sanitizeUserInput = (input) => {
  if (typeof input !== 'string') return input;

  // Remove potential XSS patterns
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

/**
 * Apply all security middleware
 */
export const applySecurityMiddleware = (app) => {
  // Request ID
  app.use(requestId);

  // Helmet security headers
  app.use(...secureHeaders);

  // Rate limiting
  app.use('/api/', generalLimiter);

  // Sanitization
  app.use(sanitizeInput);
  app.use(xssProtection);
  app.use(hppProtection);

  // CORS is already applied in server.js
};

export default {
  cspConfig,
  requestId,
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  generateCsrfToken,
  validateCsrfToken,
  sanitizeInput,
  xssProtection,
  hppProtection,
  secureHeaders,
  applySecurityMiddleware,
  sanitizeUserInput,
};
