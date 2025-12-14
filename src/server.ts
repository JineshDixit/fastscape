import './config/env/envConfig';
import express from 'express';
import cors from 'cors';
import { initPostgres_DB, sequelize } from './common/models';

const server = express();
const PORT = process.env.PORT;

server.use(cors());
server.use(express.json());

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

(async () => {
  try {
    initPostgres_DB();
    await sequelize.sync();
  } catch (error) {
    console.log('Failedd to initialize database', error);
  }
})();
