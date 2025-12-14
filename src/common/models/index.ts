import { Sequelize } from 'sequelize';
import dbConfig from '../../config/database/dbConfig';
import { initUserModel, User } from './user.model';

let sequelize: Sequelize;

const initPostgres_DB = (): void => {
  const config = dbConfig;

  sequelize = new Sequelize(config.POSTGRES_DB.database, config.POSTGRES_DB.userName, config.POSTGRES_DB.password, {
    host: config.POSTGRES_DB.host,
    port: +config.POSTGRES_DB.port,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
      evict: 1000 * 60 * 10,
    },
    ssl: true,
  });
};
initUserModel(sequelize);

export { initPostgres_DB, sequelize, User };
