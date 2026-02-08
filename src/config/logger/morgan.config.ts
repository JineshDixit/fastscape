import morgan, { StreamOptions } from 'morgan';
import logger from './logger.config';

// Stream object for Morgan to write to Winston
const stream: StreamOptions = {
  write: (message: string) => logger.http(message.trim()),
};

// Skip logging during tests
const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'test';
};

// Morgan middleware with custom format
// Format: :method :url :status :res[content-length] - :response-time ms
const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream, skip }
);

export default morganMiddleware;
