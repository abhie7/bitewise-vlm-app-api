import mongoose, { Schema } from 'mongoose';
import { INutritionData } from '../types';

const NutritionDataSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    foodName: {
      type: String,
      required: true,
    },
    calories: {
      type: Number,
      required: true,
    },
    carbs: {
      type: Number,
      required: true,
    },
    protein: {
      type: Number,
      required: true,
    },
    fat: {
      type: Number,
      required: true,
    },
    sugar: {
      type: Number,
      default: 0,
    },
    fiber: {
      type: Number,
      default: 0,
    },
    additionalInfo: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
NutritionDataSchema.index({ userId: 1, createdAt: -1 });
NutritionDataSchema.index({ foodName: 'text' });

const NutritionData = mongoose.model<INutritionData>('NutritionData', NutritionDataSchema);

export default NutritionData;
