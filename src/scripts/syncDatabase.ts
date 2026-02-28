import '../env/envConfig';
import { initPostgres_DB, sequelize } from '../models';

/**
 * Database sync script to run Sequelize sync with alter option
 * This will create tables if they don't exist and alter existing tables to match the model definitions
 */
const syncDatabase = async (): Promise<void> => {
  try {
    console.log('Initializing database connection...');
    await initPostgres_DB();
    
    console.log('Running database sync with alter option...');
    await sequelize.sync({ alter: true });
    
    console.log('Database synchronized successfully!');
    console.log('Tables have been created or altered to match the model definitions.');
    
    await sequelize.close();
    console.log('Database connection closed.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error synchronizing database:', error);
    process.exit(1);
  }
};

// Run the sync
syncDatabase();
