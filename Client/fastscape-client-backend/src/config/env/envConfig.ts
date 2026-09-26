import dotenv from 'dotenv';
import path from 'path';

const envFile = `.env.${process.env.NODE_ENV || 'development'}`;

dotenv.config({
  path: path.resolve(__dirname, '..', envFile),
});

console.log(`Loaded environment: ${envFile}`);
