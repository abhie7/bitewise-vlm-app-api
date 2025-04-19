import express from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/authController';
import { protect } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';

const router = express.Router();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('userName')
      .notEmpty()
      .withMessage('Username is required'),
    validateRequest,
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest,
  ],
  authController.login
);

router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
    validateRequest,
  ],
  authController.resetPassword
);

router.get('/me', protect, authController.getCurrentUser);

export default router;
