import '../env/envConfig';

export default {
  POSTGRES_DB: {
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    userName: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
  },
};
