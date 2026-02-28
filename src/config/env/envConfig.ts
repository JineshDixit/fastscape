import dotenv from 'dotenv';
import path from 'path';

const NODE_ENV = process.env.NODE_ENV || 'development';
const envFile = `.env.${NODE_ENV}`;

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
});

console.log(`Loaded environment: ${envFile}`);
