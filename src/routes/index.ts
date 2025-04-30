import express from 'express';
import authRoutes from './authRoutes';
import nutritionRoutes from './nutritionRoutes';
import llmRoutes from './llmRoutes';

const router = express.Router();

// Route registration
router.use('/auth', authRoutes);
router.use('/nutrition', nutritionRoutes);
router.use('/llm', llmRoutes);

export default router;
