import mongoose from 'mongoose';
import User from '../models/User';
import NutritionData from '../models/NutritionData';
import { config } from './config';
import { logger } from '../utils/logger';

// Sample users
const users = [
  {
    email: 'admin@example.com',
    password: 'password123',
    display_name: 'Admin User',
    role: 'admin',
  },
  {
    email: 'user@example.com',
    password: 'password123',
    display_name: 'Regular User',
    role: 'user',
  },
];

// Sample nutrition data
const createNutritionData = (userId: string) => [
  {
    userId,
    imageUrl: 'https://example.com/images/apple.jpg',
    foodName: 'Apple',
    calories: 95,
    carbs: 25,
    protein: 0.5,
    fat: 0.3,
    sugar: 19,
    fiber: 3,
  },
  {
    userId,
    imageUrl: 'https://example.com/images/chicken_salad.jpg',
    foodName: 'Chicken Salad',
    calories: 350,
    carbs: 10,
    protein: 25,
    fat: 15,
    sugar: 5,
    fiber: 3,
  },
];

// Connect to the database
mongoose
  .connect(config.mongodbUri)
  .then(async () => {
    logger.info('MongoDB connected successfully');

    try {
      // Clear existing data
      await User.deleteMany({});
      await NutritionData.deleteMany({});
      logger.info('Previous data cleared');

      // Create users
      const createdUsers = await User.create(users);
      logger.info(`Created ${createdUsers.length} users`);

      // Create nutrition data for each user
      for (const user of createdUsers) {
        const nutritionData = createNutritionData(user._id.toString());
        await NutritionData.create(nutritionData);
        logger.info(`Created ${nutritionData.length} nutrition entries for user ${user.email}`);
      }

      logger.info('Seed data creation completed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error seeding data:', error);
      process.exit(1);
    }
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });
