import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB configuration
  mongodbUri:
    process.env.MONGODB_URI || 'mongodb://localhost:27017/bitewise-vlm',

  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // CORS configuration
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173'
  ).split(','),

  // Logging configuration
  logLevel: process.env.LOG_LEVEL || 'info',

  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window

  lmstudioModel: process.env.LMSTUDIO_MODEL,
  lmstudioBaseUrl: process.env.LMSTUDIO_BASE_URL,
  lmstudioApiKey: process.env.LMSTUDIO_API_KEY,
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  openrouterBaseUrl: process.env.OPENROUTER_BASE_URL,
  openrouterModel: process.env.OPENROUTER_MODEL,
}
