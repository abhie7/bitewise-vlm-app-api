import mongoose, { Document, FilterQuery, Model, UpdateQuery } from 'mongoose';
import { logger } from '../utils/logger';
import { config } from '../config/config';

/**
 * MongoDB Service for database operations
 */
class MongoDBService {
  private static instance: MongoDBService;
  private isConnected: boolean = false;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): MongoDBService {
    if (!MongoDBService.instance) {
      MongoDBService.instance = new MongoDBService();
    }
    return MongoDBService.instance;
  }

  /**
   * Connect to MongoDB
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('MongoDB is already connected');
      return;
    }

    try {
      await mongoose.connect(config.mongodbUri);
      this.isConnected = true;
      logger.info('Connected to MongoDB');
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to MongoDB', error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      logger.info('MongoDB is already disconnected');
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('Disconnected from MongoDB');
    } catch (error) {
      logger.error('Failed to disconnect from MongoDB', error);
      throw error;
    }
  }

  /**
   * Create a new document
   */
  public async create<T extends Document>(
    model: Model<T>,
    data: Record<string, any>
  ): Promise<T> {
    try {
      return await model.create(data);
    } catch (error) {
      logger.error(`Error creating document in ${model.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Find documents matching a query
   */
  public async find<T extends Document>(
    model: Model<T>,
    query: FilterQuery<T> = {},
    projection: string | Record<string, any> = '',
    options: Record<string, any> = {}
  ): Promise<T[]> {
    try {
      return await model.find(query, projection, options);
    } catch (error) {
      logger.error(`Error finding documents in ${model.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Find one document matching a query
   */
  public async findOne<T extends Document>(
    model: Model<T>,
    query: FilterQuery<T> = {},
    projection: string | Record<string, any> = '',
    options: Record<string, any> = {}
  ): Promise<T | null> {
    try {
      return await model.findOne(query, projection, options);
    } catch (error) {
      logger.error(`Error finding document in ${model.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Find document by UUID
   */
  public async findByUuid<T extends Document>(
    model: Model<T>,
    uuid: string,
    projection: string | Record<string, any> = '',
    options: Record<string, any> = {}
  ): Promise<T | null> {
    try {
      return await model.findOne({ uuid }, projection, options);
    } catch (error) {
      logger.error(`Error finding document by UUID in ${model.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Find document by ID
   */
  public async findById<T extends Document>(
    model: Model<T>,
    id: string,
    projection: string | Record<string, any> = '',
    options: Record<string, any> = {}
  ): Promise<T | null> {
    try {
      return await model.findById(id, projection, options);
    } catch (error) {
      logger.error(`Error finding document by ID in ${model.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Update documents matching a query
   */
  public async updateMany<T extends Document>(
    model: Model<T>,
    query: FilterQuery<T> = {},
    update: UpdateQuery<T>,
    options: Record<string, any> = {}
  ): Promise<{ matched: number; modified: number }> {
    try {
      const result = await model.updateMany(query, update, options);
      return {
        matched: result.matchedCount,
        modified: result.modifiedCount
      };
    } catch (error) {
      logger.error(`Error updating documents in ${model.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Update one document matching a query
   */
  public async findOneAndUpdate<T extends Document>(
    model: Model<T>,
    query: FilterQuery<T> = {},
    update: UpdateQuery<T>,
    options: Record<string, any> = { new: true }
  ): Promise<T | null> {
    try {
      return await model.findOneAndUpdate(query, update, options);
    } catch (error) {
      logger.error(`Error updating document in ${model.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Delete documents matching a query
   */
  public async deleteMany<T extends Document>(
    model: Model<T>,
    query: FilterQuery<T> = {}
  ): Promise<{ deleted: number }> {
    try {
      const result = await model.deleteMany(query);
      return { deleted: result.deletedCount || 0 };
    } catch (error) {
      logger.error(`Error deleting documents in ${model.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Delete one document matching a query
   */
  public async findOneAndDelete<T extends Document>(
    model: Model<T>,
    query: FilterQuery<T> = {}
  ): Promise<T | null> {
    try {
      return await model.findOneAndDelete(query);
    } catch (error) {
      logger.error(`Error deleting document in ${model.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Count documents matching a query
   */
  public async countDocuments<T extends Document>(
    model: Model<T>,
    query: FilterQuery<T> = {}
  ): Promise<number> {
    try {
      return await model.countDocuments(query);
    } catch (error) {
      logger.error(`Error counting documents in ${model.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Run aggregation pipeline
   */
  public async aggregate<T extends Document>(
    model: Model<T>,
    pipeline: any[],
    options: Record<string, any> = {}
  ): Promise<any[]> {
    try {
      return await model.aggregate(pipeline).option(options);
    } catch (error) {
      logger.error(`Error running aggregation in ${model.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Execute a function within a transaction
   */
  public async withTransaction<T>(callback: () => Promise<T>): Promise<T> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await callback();
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Register shutdown handlers
   */
  public registerShutdownHandlers(): void {
    const gracefulShutdown = async () => {
      logger.info('Shutting down gracefully...');
      try {
        await this.disconnect();
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  }
}

// Export singleton instance
export const mongoDBService = MongoDBService.getInstance();
