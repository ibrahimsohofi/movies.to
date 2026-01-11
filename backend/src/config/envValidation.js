import dotenv from 'dotenv';

dotenv.config();

/**
 * Required environment variables
 */
const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'JWT_SECRET',
  'JWT_EXPIRE',
  'FRONTEND_URL'
];

/**
 * Optional environment variables with defaults
 */
const optionalEnvVars = {
  DB_HOST: 'localhost',
  DB_PORT: '3306',
  DB_USER: 'root',
  DB_PASSWORD: '',
  DB_NAME: 'movies_to',
  DB_CONNECTION_LIMIT: '10',
  TMDB_API_KEY: '',
  MOVIE_SYNC_TTL_MINUTES: '60',
  RESEND_API_KEY: '',
  EMAIL_FROM: 'Movies.to <noreply@movies.to>',
  LOG_LEVEL: 'info',
  TORRENT_PROVIDER: 'yts',
  YTS_BASE_DOMAIN: 'yts.mx',
  TORRENT_CACHE_TTL_MINUTES: '5',
  BCRYPT_ROUNDS: '10',
  SESSION_SECRET: ''
};

/**
 * Production-specific required variables
 */
const productionRequiredVars = [
  'SESSION_SECRET',
  'DB_PASSWORD'
];

/**
 * Validate environment variables
 */
export function validateEnv() {
  const errors = [];
  const warnings = [];

  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Check production-specific variables
  if (process.env.NODE_ENV === 'production') {
    for (const varName of productionRequiredVars) {
      if (!process.env[varName]) {
        errors.push(`Missing required production variable: ${varName}`);
      }
    }

    // Warn about weak secrets in production
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      warnings.push('JWT_SECRET should be at least 32 characters in production');
    }

    if (!process.env.TMDB_API_KEY) {
      warnings.push('TMDB_API_KEY is not set - movie sync will not work');
    }
  }

  // Set defaults for optional variables
  for (const [varName, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
      if (process.env.NODE_ENV !== 'test') {
        console.log(`ℹ️  Using default for ${varName}: ${defaultValue}`);
      }
    }
  }

  // Display warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Warnings:');
    warnings.forEach(warning => console.warn(`   ${warning}`));
    console.warn('');
  }

  // Display errors and exit if any
  if (errors.length > 0) {
    console.error('\n❌ Environment Validation Failed:');
    errors.forEach(error => console.error(`   ${error}`));
    console.error('\n💡 Please check your .env file\n');
    process.exit(1);
  }

  if (process.env.NODE_ENV !== 'test') {
    console.log('✅ Environment variables validated successfully');
  }
}

/**
 * Get validated environment configuration
 */
export function getConfig() {
  validateEnv();

  return {
    port: parseInt(process.env.PORT, 10),
    nodeEnv: process.env.NODE_ENV,
    database: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      name: process.env.DB_NAME,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10)
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expire: process.env.JWT_EXPIRE
    },
    cors: {
      origin: process.env.FRONTEND_URL
    },
    tmdb: {
      apiKey: process.env.TMDB_API_KEY,
      syncTtl: parseInt(process.env.MOVIE_SYNC_TTL_MINUTES, 10)
    },
    email: {
      resendApiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM
    },
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10),
      sessionSecret: process.env.SESSION_SECRET
    },
    logging: {
      level: process.env.LOG_LEVEL
    },
    torrents: {
      provider: process.env.TORRENT_PROVIDER,
      ytsDomain: process.env.YTS_BASE_DOMAIN,
      cacheTtl: parseInt(process.env.TORRENT_CACHE_TTL_MINUTES, 10)
    }
  };
}

export default {
  validateEnv,
  getConfig
};
