import express from 'express';
import authRoutes from './authRoutes';
import nutritionRoutes from './nutritionRoutes';

const router = express.Router();

// Route registration
router.use('/auth', authRoutes);
router.use('/nutrition', nutritionRoutes);

export default router;
