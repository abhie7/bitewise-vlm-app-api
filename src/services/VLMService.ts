import { config } from '../config/config'
import { logger } from '../utils/logger'
import axios from 'axios'

// Types
interface NutritionResponse {
  parsedContent: any
  rawContent: string
  data: any
  timeTaken: number
}

/**
 * Global OpenRouter client for making API requests to the OpenRouter service
 */
class OpenRouterClient {
  private apiKey: string
  private baseUrl: string
  private model: string

  constructor(
    apiKey: string = config.openrouterApiKey || '',
    baseUrl: string = 'https://openrouter.ai/api/v1/chat/completions',
    model: string = config.openrouterModel || 'google/gemini-2.0-flash-exp:free'
  ) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
    this.model = model

    if (!this.apiKey) {
      logger.warn('OpenRouter API key is missing')
    }
  }

  /**
   * Makes a request to the OpenRouter API for chat completions using axios
   */
  async chatCompletion(options: {
    model?: string
    messages: Array<{
      role: string
      content: Array<{
        type: string
        text?: string
        image_url?: {
          url: string
        }
      }> | string
    }>
    temperature?: Number
  }): Promise<NutritionResponse> {
    const startTime = Date.now()
    const model = options.model || this.model
    const url = this.baseUrl

    try {
      logger.debug(`Making OpenRouter request to model: ${model}`)
      logger.debug(`OpenRouter request sent to ${url}`)

      // Add response_format to force JSON output if not explicitly provided
      const requestData = {
        model: model,
        messages: options.messages,
        temperature: options.temperature || 0.2,
      }

      // Enhanced logging for request data
      // logger.debug(`Request data: ${JSON.stringify(requestData, null, 2)}`)

      const response = await axios({
        method: 'post',
        url: url,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'VLM Nutrition Info App'
        },
        data: requestData
      });

      const data = response.data;
      // Enhanced logging for complete response data
      logger.debug(`OpenRouter response received: ${JSON.stringify(data, null, 2)}`)
      const endTime = Date.now()
      const timeTaken = (endTime - startTime) / 1000

      logger.debug(`OpenRouter request completed in ${timeTaken}s`)

      // Try to parse JSON from the content if it exists
      const rawContent = data.choices?.[0]?.message?.content || ''
      // Enhanced logging for raw content
      logger.debug(`Raw content from response: ${rawContent}`)

      let parsedContent = null

      try {
        // First try to parse the content directly as JSON
        try {
          parsedContent = JSON.parse(rawContent)
          logger.debug(`Successfully parsed raw JSON from response: ${JSON.stringify(parsedContent, null, 2)}`)
        } catch (directParseError) {
          // If direct parsing fails, try to extract JSON from markdown code blocks
          const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/)
          if (jsonMatch && jsonMatch[1]) {
            parsedContent = JSON.parse(jsonMatch[1].trim())
            logger.debug('Successfully parsed JSON from markdown code block')
          } else {
            // Try one more approach - look for { at the beginning of content
            const possibleJsonStart = rawContent.indexOf('{')
            const possibleJsonEnd = rawContent.lastIndexOf('}')

            if (possibleJsonStart >= 0 && possibleJsonEnd > possibleJsonStart) {
              const jsonCandidate = rawContent.substring(possibleJsonStart, possibleJsonEnd + 1)
              parsedContent = JSON.parse(jsonCandidate)
              logger.debug('Successfully extracted and parsed JSON from content')
            } else {
              // If we can't parse JSON, just use the raw content
              throw new Error('Could not extract valid JSON')
            }
          }
        }
      } catch (error) {
        logger.warn(`Failed to parse JSON from content, using raw content: ${error instanceof Error ? error.message : String(error)}`)
        parsedContent = { text: rawContent }
      }

      return {
        parsedContent,
        rawContent,
        data,
        timeTaken
      }
    } catch (error: any) {
      const endTime = Date.now()
      const timeTaken = (endTime - startTime) / 1000

      logger.error(`OpenRouter request failed in ${timeTaken}s: ${error.message}`)
      if (error.response) {
        logger.error('Error response data:', error.response.data)
      }

      throw {
        error: error.message || "Unknown error",
        timeTaken,
        details: error.response?.data || {}
      }
    }
  }

  /**
   * Extract nutrition information from a food label image
   */
  async extractNutritionInfo(imageUrl: string): Promise<NutritionResponse> {
    const defaultPrompt = `Extract comprehensive nutritional information from the food label image. Structure the output in JSON format, including fields even if values are missing (use 0 or null). Ensure all units are standardized (g, mg, mcg, %DV) and include daily value percentages where available. Handle abbreviations appropriately (e.g., 'sat.' → 'saturated', 'cholest.' → 'cholesterol'). If any field is missing from the label, use 0 for numerical values and empty strings/null for text fields. Add your confidence score precisely upto 2 floating points to the metadata field. Please include the health insights from your side if possible. I want only JSON data in your response.

    Response Structure:
    {
        "metadata": {
            "confidence_score": "float or null",
            "error_status": "boolean or null"
        },
        "product_details": {
            "serving_size": {
                "amount": "float or null",
                "unit": "string",
                "type": "string or null"
            }
        },
        "total_calories": "integer",
        "nutrients": {
            "total_fat": {
                "amount": "float or null",
                "unit": "g",
                "daily_value_percentage": "float or null",
                "group": "fats",
                "category": "macronutrient",
                "sub_nutrients": {
                    "saturated_fat": {
                        "amount": "float or null",
                        "unit": "g",
                        "daily_value_percentage": "float or null",
                        "group": "fats",
                        "category": "macronutrient"
                    },
                    "trans_fat": {
                        "amount": "float or null",
                        "unit": "g",
                        "daily_value_percentage": "float or null",
                        "group": "fats",
                        "category": "macronutrient"
                    }
                }
            },
            "cholesterol": {
                "amount": "float or null",
                "unit": "mg",
                "daily_value_percentage": "float or null",
                "group": "fats",
                "category": "macronutrient"
            },
            "carbohydrates": {
                "amount": "float or null",
                "unit": "g",
                "daily_value_percentage": "float or null",
                "group": "carbohydrates",
                "category": "macronutrient",
                "sub_nutrients": {
                    "dietary_fiber": {
                        "amount": "float or null",
                        "unit": "g",
                        "daily_value_percentage": "float or null",
                        "group": "carbohydrates",
                        "category": "macronutrient"
                    },
                    "total_sugar": {
                        "amount": "float or null",
                        "unit": "g",
                        "daily_value_percentage": "float or null",
                        "group": "carbohydrates",
                        "category": "macronutrient"
                    },
                    "added_sugar": {
                        "amount": "float or null",
                        "unit": "g",
                        "daily_value_percentage": "float or null",
                        "group": "carbohydrates",
                        "category": "macronutrient"
                    }
                }
            },
            "protein": {
                "amount": "float or null",
                "unit": "g",
                "daily_value_percentage": "float or null",
                "group": "protein",
                "category": "macronutrient"
            },
            "sodium": {
                "amount": "float or null",
                "unit": "mg",
                "daily_value_percentage": "float or null",
                "group": "mineral",
                "category": "micronutrient"
            },
            "calcium": {
                "amount": "float or null",
                "unit": "mg",
                "daily_value_percentage": "float or null",
                "group": "mineral",
                "category": "micronutrient"
            },
            "iron": {
                "amount": "float or null",
                "unit": "mg",
                "daily_value_percentage": "float or null",
                "group": "mineral",
                "category": "micronutrient"
            },
            "vitamins": [
                {
                    "vitamin_type": "string",
                    "amount": "float",
                    "unit": "mg",
                    "daily_value_percentage": "float or null",
                    "group": "vitamins",
                    "category": "micronutrient"
                }
            ]
        },
        "ingredients": ["string"] or null,
        "allergens": ["string"] or null
    }`

    return this.chatCompletion({
      model: this.model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: defaultPrompt
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
    })
  }
}

/**
 * Simplified VLM service that uses the OpenRouterClient
 */
class VLMService {
  private client: OpenRouterClient

  constructor(client: OpenRouterClient = openRouterClient) {
    this.client = client
  }

  /**
   * Analyze a food image to extract nutrition information
   * This method only requires an image URL
   */
  async analyzeFood(imageUrl: string): Promise<any> {
    try {
      const result = await this.client.extractNutritionInfo(imageUrl)
      return result.parsedContent
    } catch (error) {
      logger.error('Failed to analyze food image', error)
      throw error
    }
  }

  /**
   * Make a general chat completion request with optional image
   */
  async call(
    prompt: string,
    imageUrl?: string,
    model?: string
  ): Promise<any> {
    try {
      // If only imageUrl is provided, assume we want to analyze food
      if (imageUrl && (!prompt || prompt.trim() === '')) {
        return this.analyzeFood(imageUrl)
      }

      const messages = [{
        role: 'user',
        content: imageUrl
          ? [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          : prompt
      }]

      const result = await this.client.chatCompletion({
        model,
        messages
      })

      return result.parsedContent
    } catch (error) {
      logger.error('Chat completion failed', error)
      throw error
    }
  }
}

// Create global instances
const openRouterClient = new OpenRouterClient()
const vlmService = new VLMService(openRouterClient)

// Simple test function
async function testNutritionExtraction() {
  try {
    const result = await vlmService.analyzeFood(
      'https://c8.alamy.com/comp/W31N93/nutrition-facts-food-labelling-om-a-jar-of-peanut-butter-usa-united-states-of-america-W31N93.jpg'
    )

    console.log('Parsed Content:', result)
    return result
  } catch (error) {
    console.error('Test failed:', error)
    return null
  }
}

export { OpenRouterClient, openRouterClient, VLMService, vlmService }

// Run test if this module is executed directly
if (require.main === module) {
  testNutritionExtraction().catch(console.error)
}