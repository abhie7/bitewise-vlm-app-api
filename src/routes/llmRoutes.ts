import { vlmService } from './../services/VLMService'
import express, { Request, Response } from 'express'
import { logger } from '../utils/logger'

const router = express.Router()

interface GenerateRequestBody {
  imageUrl?: string
  prompt?: string
  model?: string
}

/**
 * @route POST /api/llm/generate
 * @desc Generate text response from LLM
 * @access Public
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { imageUrl, prompt = '', model }: GenerateRequestBody = req.body

    // Validate request
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required',
      })
    }

    try {
      logger.info(`Processing image URL: ${imageUrl}`)

      // If imageUrl is provided with no prompt, use analyzeFood method
      const result = prompt
        ? await vlmService.call(prompt, imageUrl, model)
        : await vlmService.analyzeFood(imageUrl)

      logger.info('[LLM SERVICE RESPONSE]', result)

      if (!result) {
        return res.status(500).json({
          success: false,
          message: 'No response from LLM service',
        })
      }

      return res.status(200).json({
        success: true,
        data: {
          content: result,
        },
      })
    } catch (serviceError: any) {
      logger.error('[LLM SERVICE ERROR]', serviceError.message)
      return res.status(500).json({
        success: false,
        message:
          serviceError.message ||
          'Error processing request with language model',
        error: serviceError.name,
        details: serviceError.details || {},
      })
    }
  } catch (error: any) {
    logger.error('[LLM API ERROR]', error.message)
    return res.status(500).json({
      success: false,
      message:
        error.message || 'An error occurred while processing your request',
      error: error.name,
    })
  }
})

export default router