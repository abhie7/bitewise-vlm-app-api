import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/config';
import { mongoDBService } from './services/MongoDBService';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './utils/logger';

const app = express();

mongoDBService.connect()
  .then(() => {
    logger.info('MongoDB connected successfully');
  })
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

const PORT = config.port;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});

const gracefulShutdown = async () => {
  logger.info('Received shutdown signal. Closing server and database connections...');

  server.close(() => {
    logger.info('HTTP server closed');

    mongoDBService.disconnect()
      .then(() => {
        logger.info('MongoDB disconnected successfully');
        process.exit(0);
      })
      .catch(err => {
        logger.error('Error disconnecting from MongoDB:', err);
        process.exit(1);
      });
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: config.allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api', routes);

app.use(errorHandler);

export default app;
