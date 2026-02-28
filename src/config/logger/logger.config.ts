import winston from 'winston';
// import path from 'path';

// Define log levels with priorities
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each log level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about our custom colors
winston.addColors(colors);

// Determine log level based on environment
const level = (): string => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define timestamp format with milliseconds
const timestampFormat = winston.format.timestamp({
  format: 'YYYY-MM-DD HH:mm:ss:ms',
});

// Console format with colors for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  timestampFormat,
  winston.format.printf((info) => `${info.timestamp} [${info.level}]: ${info.message}`),
);

// JSON format for file logging
// const fileFormat = winston.format.combine(timestampFormat, winston.format.json());

// Define transports
const transports = [
  // Console transport for immediate feedback
  new winston.transports.Console({
    format: consoleFormat,
  }),
  // // Error log file - only errors
  // new winston.transports.File({
  //   filename: path.join('logs', 'error.log'),
  //   level: 'error',
  //   format: fileFormat,
  // }),
  // // All logs file - complete audit trail
  // new winston.transports.File({
  //   filename: path.join('logs', 'all.log'),
  //   format: fileFormat,
  // }),
];

// Create the logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // Handle exceptions and rejections
  // exceptionHandlers: [
  //   new winston.transports.File({
  //     filename: path.join('logs', 'exceptions.log'),
  //     format: fileFormat,
  //   }),
  // ],
  // rejectionHandlers: [
  //   new winston.transports.File({
  //     filename: path.join('logs', 'rejections.log'),
  //     format: fileFormat,
  //   }),
  // ],
  exitOnError: false,
});

export default logger;
