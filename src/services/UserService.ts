import bcrypt from 'bcryptjs';
import { IUser } from '../types';
import { mongoDBService } from './MongoDBService';
import User from '../models/User';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

class UserService {
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    if (!email) {
      logger.error('Empty email provided to findByEmail');
      return null;
    }

    const normalizedEmail = email.toLowerCase().trim();
    logger.debug(`Finding user by normalized email: ${normalizedEmail}`);

    try {
      const user = await mongoDBService.findOne(User, { email: normalizedEmail });
      logger.debug(`User lookup result: ${user ? 'Found' : 'Not found'}`);
      return user;
    } catch (error) {
      logger.error('Error in findByEmail:', error);
      return null;
    }
  }

  /**
   * Find user by UUID
   */
  async findByUuid(uuid: string): Promise<IUser | null> {
    if (!uuid) {
      logger.error('Empty UUID provided to findByUuid');
      return null;
    }

    logger.debug(`Finding user by UUID: ${uuid}`);

    try {
      const user = await mongoDBService.findOne(User, { uuid }, '+password');
      logger.debug(`User lookup by UUID result: ${user ? 'Found' : 'Not found'}`);
      return user;
    } catch (error) {
      logger.error('Error in findByUuid:', error);
      return null;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<IUser | null> {
    return await mongoDBService.findById(User, id);
  }

  /**
   * Create a new user
   */
  async createUser(userData: Partial<IUser>): Promise<IUser> {
    // Generate UUID if not provided
    if (!userData.uuid) {
      userData.uuid = uuidv4();
    }

    // Hash password before creating user
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    // Ensure email is normalized
    if (userData.email) {
      userData.email = userData.email.toLowerCase().trim();
    }

    return await mongoDBService.create(User, userData);
  }

  /**
   * Compare password with hashed password
   */
  async comparePassword(candidatePassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(candidatePassword, hashedPassword);
    } catch (error) {
      return false;
    }
  }

  /**
   * Update user by ID
   */
  async updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    // Hash password if it's being updated
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }
    return await mongoDBService.findOneAndUpdate(User, { _id: id }, userData);
  }
}

export const userService = new UserService();
