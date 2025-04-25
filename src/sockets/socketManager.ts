import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { config } from '../config/config'
import { UserPayload } from '../types'
import { logger } from '../utils/logger'

// Socket event constants
export const socketEvents = {
  connect: 'connect',
  disconnect: 'disconnect',
  error: 'error',
  nutritionAnalysisStart: 'nutrition-analysis-start',
  nutritionAnalysisProgress: 'nutrition-analysis-progress',
  nutritionAnalysisComplete: 'nutrition-analysis-complete',
  nutritionAnalysisError: 'nutrition-analysis-error',
}

// Setup Socket.IO server
export const setupSocketIO = (io: Server) => {
  // Set up ping interval for more consistent connections
  io.engine.on('connection_error', (err) => {
    logger.error(`Connection error: ${err.message}`)
  })

  // Authenticate socket connections
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth.token || socket.handshake.headers.token

      if (!token) {
        logger.warn(`Socket ${socket.id} attempted connection without token`)
        return next(new Error('Authentication error: Token required'))
      }

      try {
        // Verify token
        const decoded = jwt.verify(token, config.jwtSecret) as UserPayload
        socket.data.user = decoded
        logger.debug(`Socket ${socket.id} authenticated for user ${decoded.id}`)
        next()
      } catch (error) {
        logger.error(`Socket ${socket.id} Authentication Error:`, error)
        next(new Error('Authentication error: Invalid token'))
      }
    } catch (error) {
      logger.error(`Socket ${socket.id} Middleware Error:`, error)
      next(new Error('Internal server error'))
    }
  })

  // Handle socket connections
  io.on(socketEvents.connect, (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`)

    // Get user info from socket data
    const user = socket.data.user as UserPayload

    // Join user-specific room
    if (user?.id) {
      socket.join(`user:${user.id}`)
      logger.info(`User ${user.id} joined their room`)

      // Send welcome message
      socket.emit('welcome', {
        message: `Welcome ${user.email || 'user'}`,
        socketId: socket.id,
      })
    }

    // Handle heartbeat to keep connection alive
    socket.on('heartbeat', () => {
      socket.emit('heartbeat', { time: new Date().toISOString() })
    })

    // Handle nutrition analysis start
    socket.on(
      socketEvents.nutritionAnalysisStart,
      async (data: { imageUrl: string }) => {
        try {
          // Validate user
          if (!user?.id) {
            socket.emit(socketEvents.error, { message: 'Unauthorized' })
            return
          }

          // Emit initial progress
          socket.emit(socketEvents.nutritionAnalysisProgress, {
            progress: 10,
            message: 'Starting image analysis...',
          })

          // Simulate progress (in a real app, this would be actual processing)
          setTimeout(() => {
            socket.emit(socketEvents.nutritionAnalysisProgress, {
              progress: 50,
              message: 'Analyzing food content...',
            })
          }, 1500)

          setTimeout(() => {
            socket.emit(socketEvents.nutritionAnalysisProgress, {
              progress: 75,
              message: 'Calculating nutritional values...',
            })
          }, 3000)

          // Simulate completion with sample data
          setTimeout(() => {
            socket.emit(socketEvents.nutritionAnalysisComplete, {
              foodName: 'Sample Food',
              calories: 250,
              carbs: 30,
              protein: 15,
              fat: 10,
              sugar: 5,
              fiber: 3,
              additionalInfo: 'This is a sample analysis.',
            })
          }, 5000)
        } catch (error) {
          logger.error('Nutrition Analysis Error:', error)
          socket.emit(socketEvents.nutritionAnalysisError, {
            message: 'Error analyzing image',
          })
        }
      }
    )

    // Handle disconnect
    socket.on(socketEvents.disconnect, (reason) => {
      logger.info(`Socket disconnected: ${socket.id}, Reason: ${reason}`)
    })
  })

  return io
}
