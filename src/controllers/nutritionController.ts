import { Response, NextFunction } from 'express';
import DefaultNutritionData, { getNutritionDataModel } from '../models/NutritionData';
import { ApiResponse, AuthRequest } from '../types';
import { logger } from '../utils/logger';

// Create new nutrition data
export const createNutritionData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { imageUrl, foodName, calories, carbs, protein, fat, sugar, fiber, additionalInfo } = req.body;

    if (!req.user?.uuid) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Get user-specific model
    const NutritionData = getNutritionDataModel(req.user.uuid);

    const nutritionData = await NutritionData.create({
      userId: req.user.uuid,
      imageUrl,
      foodName,
      calories,
      carbs,
      protein,
      fat,
      sugar: sugar || 0,
      fiber: fiber || 0,
      additionalInfo
    });

    const response: ApiResponse<any> = {
      success: true,
      message: 'Nutrition data created successfully',
      data: nutritionData,
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Create nutrition data error:', error);
    next(error);
  }
};

// Get all nutrition data for a user
export const getNutritionDataByUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.uuid) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { page = 1, limit = 10, search } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Get user-specific model
    const NutritionData = getNutritionDataModel(req.user.uuid);

    // Build query
    const query: any = { userId: req.user.uuid };

    // If search term is provided, use text search
    if (search) {
      query.$text = { $search: search as string };
    }

    // Get total count for pagination
    const total = await NutritionData.countDocuments(query);

    // Get nutrition data with pagination
    const nutritionData = await NutritionData.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const response: ApiResponse<any> = {
      success: true,
      message: 'Nutrition data retrieved successfully',
      data: {
        items: nutritionData,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get nutrition data error:', error);
    next(error);
  }
};

// Get single nutrition data entry
export const getNutritionDataById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!req.user?.uuid) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Get user-specific model
    const NutritionData = getNutritionDataModel(req.user.uuid);

    const nutritionData = await NutritionData.findOne({
      _id: id,
      userId: req.user.uuid,
    });

    if (!nutritionData) {
      return res.status(404).json({
        success: false,
        message: 'Nutrition data not found',
      });
    }

    const response: ApiResponse<any> = {
      success: true,
      message: 'Nutrition data retrieved successfully',
      data: nutritionData,
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get nutrition data by ID error:', error);
    next(error);
  }
};

// Update nutrition data
export const updateNutritionData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { foodName, calories, carbs, protein, fat, sugar, fiber, additionalInfo } = req.body;

    if (!req.user?.uuid) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Get user-specific model
    const NutritionData = getNutritionDataModel(req.user.uuid);

    const nutritionData = await NutritionData.findOneAndUpdate(
      { _id: id, userId: req.user.uuid },
      {
        foodName,
        calories,
        carbs,
        protein,
        fat,
        sugar,
        fiber,
        additionalInfo,
      },
      { new: true }
    );

    if (!nutritionData) {
      return res.status(404).json({
        success: false,
        message: 'Nutrition data not found',
      });
    }

    const response: ApiResponse<any> = {
      success: true,
      message: 'Nutrition data updated successfully',
      data: nutritionData,
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Update nutrition data error:', error);
    next(error);
  }
};

// Delete nutrition data
export const deleteNutritionData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!req.user?.uuid) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Get user-specific model
    const NutritionData = getNutritionDataModel(req.user.uuid);

    const nutritionData = await NutritionData.findOneAndDelete({
      _id: id,
      userId: req.user.uuid,
    });

    if (!nutritionData) {
      return res.status(404).json({
        success: false,
        message: 'Nutrition data not found',
      });
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Nutrition data deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Delete nutrition data error:', error);
    next(error);
  }
};
