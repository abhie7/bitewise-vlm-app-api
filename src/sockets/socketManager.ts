import { NutritionResult } from '../types/index';
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { config } from '../config/config'
import { UserPayload } from '../types'
import { logger } from '../utils/logger'
import { vlmService } from '../services/VLMService'
import { getNutritionDataModel } from '../models/NutritionData';

export const socketEvents = {
  connect: 'connect',
  disconnect: 'disconnect',
  error: 'error',
  nutritionAnalysisStart: 'nutrition-analysis-start',
  nutritionAnalysisProgress: 'nutrition-analysis-progress',
  nutritionAnalysisComplete: 'nutrition-analysis-complete',
  nutritionAnalysisError: 'nutrition-analysis-error',
  analyzeImage: 'analyze_image',
}

interface AnalysisRequest {
  imageUrl: string;
  imageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export const setupSocketIO = (io: Server) => {
  io.engine.on('connection_error', (err) => {
    logger.error(`Connection error: ${err.message}`)
  })

  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth.token || socket.handshake.headers.token

      if (!token) {
        logger.warn(`Socket ${socket.id} attempted connection without token`)
        return next(new Error('Authentication error: Token required'))
      }

      try {
        const decoded = jwt.verify(token, config.jwtSecret) as UserPayload
        socket.data.user = decoded
        logger.debug(`Socket ${socket.id} authenticated for user ${decoded.uuid}`)
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

  io.on(socketEvents.connect, (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`)

    const user = socket.data.user as UserPayload

    if (user?.uuid) {
      socket.join(`user:${user.uuid}`)
      logger.info(`User ${user.uuid} joined their room`)

      socket.emit('welcome', {
        message: `Welcome ${user.email || 'user'}`,
        socketId: socket.id,
      })
    }

    socket.on('heartbeat', () => {
      socket.emit('heartbeat', { time: new Date().toISOString() })
    })

    // Handle image analysis request
    socket.on(socketEvents.analyzeImage, async (data: AnalysisRequest) => {
      try {
        // Validate user
        if (!user?.uuid) {
          socket.emit(socketEvents.error, { message: 'Unauthorized' })
          return
        }

        logger.info(`Image analysis requested by user ${user.uuid} for image: ${data.imageId}`)

        // Notify client that analysis has started
        socket.emit(socketEvents.nutritionAnalysisStart, {
          imageId: data.imageId,
          message: 'Analysis has started',
        })

        // Send initial progress update
        socket.emit(socketEvents.nutritionAnalysisProgress, {
          progress: 10,
          message: 'Starting image analysis...',
        })

        // Send progress update as the analysis continues
        setTimeout(() => {
          socket.emit(socketEvents.nutritionAnalysisProgress, {
            progress: 30,
            message: 'Processing image content...',
          })
        }, 1000)

        setTimeout(() => {
          socket.emit(socketEvents.nutritionAnalysisProgress, {
            progress: 50,
            message: 'Analyzing food content...',
          })
        }, 2000)

        try {
          // Call VLM service to analyze the food image
          const analysisResult = await vlmService.analyzeFood(data.imageUrl)

          // Send one more progress update before completion
          socket.emit(socketEvents.nutritionAnalysisProgress, {
            progress: 90,
            message: 'Finalizing results...',
          })

          // Extract and format the nutrition data from the analysis result
          const nutritionData: NutritionResult = extractNutritionData(analysisResult)

          // Save nutrition data to database with userId and imageUrl
          try {
            // Get user-specific model
            const NutritionData = getNutritionDataModel(user.uuid);

            const savedData = await NutritionData.create({
              userId: user.uuid,
              imageUrl: data.imageUrl,
              imageId: data.imageId,
              fileName: data.fileName,
              fileType: data.fileType,
              fileSize: data.fileSize,
              foodName: nutritionData.foodName,
              calories: nutritionData.calories,
              carbs: nutritionData.carbs,
              protein: nutritionData.protein,
              fat: nutritionData.fat,
              sugar: nutritionData.sugar,
              fiber: nutritionData.fiber,
              additionalInfo: nutritionData.additionalInfo,
              rawAnalysisData: nutritionData.rawData || {}
            }) as { _id: string };

            logger.info(`Saved nutrition data for user ${user.uuid}, id: ${savedData._id}`);

            // Include the saved data ID in the response so frontend can reference it
            nutritionData.id = savedData._id.toString();
          } catch (dbError) {
            logger.error(`Failed to save nutrition data: ${dbError}`);
            // Continue with the response even if save fails - don't block the user
          }

          // Send the complete analysis result
          setTimeout(() => {
            socket.emit(socketEvents.nutritionAnalysisComplete, nutritionData)
            logger.info(`Analysis completed for user ${user.uuid}, image: ${data.imageId}`)
          }, 1000)

        } catch (analysisError: any) {
          logger.error(`Analysis error for ${data.imageId}:`, analysisError)
          socket.emit(socketEvents.nutritionAnalysisError, {
            message: analysisError.message || 'Error analyzing image',
            details: analysisError.details || {}
          })
        }
      } catch (error: any) {
        logger.error('Socket analysis request error:', error)
        socket.emit(socketEvents.nutritionAnalysisError, {
          message: error.message || 'Error processing your request',
        })
      }
    })

    socket.on(socketEvents.disconnect, (reason) => {
      logger.info(`Socket disconnected: ${socket.id}, Reason: ${reason}`)
    })
  })

  return io
}

// Helper function to extract and format nutrition data from the analysis result
function extractNutritionData(analysisResult: any): NutritionResult {
  try {
    if (!analysisResult) {
      return {
        foodName: 'Unknown food',
        calories: 0,
        carbs: 0,
        protein: 0,
        fat: 0,
        sugar: 0,
        fiber: 0,
        additionalInfo: 'No data available',
        rawData: null // Ensure rawData is always included
      }
    }

    // Extract nutrition data from the complex nested structure
    const parsedData: NutritionResult = {
      foodName: analysisResult.product_details?.name || 'Food item',
      calories: analysisResult.total_calories || 0,
      carbs: analysisResult.nutrients?.carbohydrates?.amount || 0,
      protein: analysisResult.nutrients?.protein?.amount || 0,
      fat: analysisResult.nutrients?.total_fat?.amount || 0,
      sugar: analysisResult.nutrients?.carbohydrates?.sub_nutrients?.total_sugar?.amount || 0,
      fiber: analysisResult.nutrients?.carbohydrates?.sub_nutrients?.dietary_fiber?.amount || 0,
      additionalInfo: generateAdditionalInfo(analysisResult),
      rawData: analysisResult // Include the raw data for reference
    }

    return parsedData
  } catch (error) {
    logger.error('Error extracting nutrition data:', error)
    return {
      foodName: 'Processed food item',
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      sugar: 0,
      fiber: 0,
      additionalInfo: 'Error extracting detailed nutrition information',
      rawData: null // Ensure rawData is always included
    }
  }
}

// Generate additional information text from the analysis result
function generateAdditionalInfo(analysisResult: any): string {
  try {
    const parts = []

    // Add serving size if available
    if (analysisResult.product_details?.serving_size?.amount) {
      parts.push(`Serving size: ${analysisResult.product_details.serving_size.amount} ${analysisResult.product_details.serving_size.unit || ''}`)
    }

    // Add sodium info if available
    if (analysisResult.nutrients?.sodium?.amount) {
      parts.push(`Sodium: ${analysisResult.nutrients.sodium.amount}${analysisResult.nutrients.sodium.unit || 'mg'}`)
    }

    // Add vitamins if available
    if (analysisResult.nutrients?.vitamins?.length) {
      const vitaminsText = analysisResult.nutrients.vitamins
        .map((v: any) => `${v.vitamin_type}: ${v.amount}${v.unit || ''}`)
        .join(', ')
      parts.push(`Vitamins: ${vitaminsText}`)
    }

    // Add allergens if available
    if (analysisResult.allergens?.length) {
      parts.push(`Allergens: ${analysisResult.allergens.join(', ')}`)
    }

    return parts.join('\n') || 'No additional information available'
  } catch (error) {
    return 'Error generating additional information'
  }
}
