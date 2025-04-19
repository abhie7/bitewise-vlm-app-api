import winston from 'winston';
import { config } from '../config/config';

const formats = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define the custom settings for each transport
const options = {
  console: {
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    handleExceptions: true,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    ),
  },
  file: {
    level: 'info',
    filename: 'logs/app.log',
    handleExceptions: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  },
};

// Instantiate a new Winston logger
export const logger = winston.createLogger({
  level: config.logLevel,
  format: formats,
  defaultMeta: { service: 'bitewise-vlm-api' },
  transports: [
    new winston.transports.Console(options.console),
    ...(config.nodeEnv === 'production'
      ? [new winston.transports.File(options.file)]
      : []),
  ],
  exitOnError: false,
});

// Create a stream object for Morgan
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
