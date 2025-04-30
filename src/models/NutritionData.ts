import mongoose, { Schema, Model } from 'mongoose';
import { INutritionData } from '../types/index';

// Base schema definition (same for all user collections)
const NutritionDataSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  imageId: {
    type: String,
    required: false
  },
  fileName: {
    type: String,
    required: false
  },
  fileType: {
    type: String,
    required: false
  },
  fileSize: {
    type: Number,
    required: false
  },
  foodName: {
    type: String,
    required: true,
    index: true
  },
  calories: {
    type: Number,
    required: true
  },
  carbs: {
    type: Number,
    required: true
  },
  protein: {
    type: Number,
    required: true
  },
  fat: {
    type: Number,
    required: true
  },
  sugar: {
    type: Number,
    default: 0
  },
  fiber: {
    type: Number,
    default: 0
  },
  additionalInfo: {
    type: String
  },
  rawAnalysisData: {
    type: Schema.Types.Mixed,
    required: false
  }
}, {
  timestamps: true
});

// Create text index for search functionality
NutritionDataSchema.index({ foodName: 'text', additionalInfo: 'text' });

// Cache to store models for different collections
const modelCache: Record<string, Model<INutritionData>> = {};

// Default model (for backward compatibility)
const DefaultNutritionData = mongoose.model<INutritionData>('NutritionData', NutritionDataSchema);

/**
 * Get a NutritionData model for a specific user
 * @param userId The user's UUID
 * @returns A Mongoose model for the user's nutrition data collection
 */
export const getNutritionDataModel = (userId: string): Model<INutritionData> => {
  const collectionName = `${userId}.nutritionData`;

  // Return from cache if exists
  if (modelCache[collectionName]) {
    return modelCache[collectionName];
  }

  // Create new model with user-specific collection name
  const model = mongoose.model<INutritionData>(
    collectionName,
    NutritionDataSchema,
    collectionName // Explicitly set collection name
  );

  // Cache the model
  modelCache[collectionName] = model;

  return model;
};

// Export default model for backward compatibility
export default DefaultNutritionData;
