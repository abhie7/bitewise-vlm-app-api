import express from 'express';
import { body } from 'express-validator';
import {
  createNutritionData,
  getNutritionDataByUser,
  getNutritionDataById,
  updateNutritionData,
  deleteNutritionData,
} from '../controllers/nutritionController';
import { protect } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';

const router = express.Router();

// All nutrition routes require authentication
router.use(protect);

// Create nutrition data with validation
router.post(
  '/',
  [
    body('imageUrl').notEmpty().withMessage('Image URL is required'),
    body('foodName').notEmpty().withMessage('Food name is required'),
    body('calories').isNumeric().withMessage('Calories must be a number'),
    body('carbs').isNumeric().withMessage('Carbs must be a number'),
    body('protein').isNumeric().withMessage('Protein must be a number'),
    body('fat').isNumeric().withMessage('Fat must be a number'),
    validateRequest,
  ],
  createNutritionData
);

// Get all nutrition data for authenticated user
router.get('/', getNutritionDataByUser);

// Get single nutrition data entry
router.get('/:id', getNutritionDataById);

// Update nutrition data with validation
router.put(
  '/:id',
  [
    body('foodName').optional().notEmpty().withMessage('Food name cannot be empty'),
    body('calories').optional().isNumeric().withMessage('Calories must be a number'),
    body('carbs').optional().isNumeric().withMessage('Carbs must be a number'),
    body('protein').optional().isNumeric().withMessage('Protein must be a number'),
    body('fat').optional().isNumeric().withMessage('Fat must be a number'),
    validateRequest,
  ],
  updateNutritionData
);

// Delete nutrition data
router.delete('/:id', deleteNutritionData);

export default router;
