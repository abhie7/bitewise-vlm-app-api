import express from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { config } from './config/config'
import { errorHandler } from './middlewares/errorHandler'
import { setupSocketIO } from './sockets/socketManager'
import { logger } from './utils/logger'
import routes from './routes'

const app = express()
const server = http.createServer(app)


// Setup Socket.IO
const io = new SocketIOServer(server, {
  path: '/ws',
  cors: {
    origin: config.allowedOrigins,
    credentials: true,
  },
  // Increase ping timeouts to match client
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 20000,
})

setupSocketIO(io)

// Connect to MongoDB
mongoose
  .connect(config.mongodbUri)
  .then(() => {
    logger.info('MongoDB connected successfully')
  })
  .catch((err) => {
    logger.error('MongoDB connection error: ', err)
    process.exit(1)
  })

// Apply middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
  })
)
app.use(helmet())
app.use(compression())
app.use(morgan('dev'))

// Apply rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
})
app.use('/api/', limiter)

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: config.nodeEnv })
})

// API routes
app.use('/api', routes)

// Error handling middleware (must be the last middleware)
app.use(errorHandler)

// Start the server
server.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // Close server & exit process
  server.close(() => process.exit(1))
})

export { app, server }
