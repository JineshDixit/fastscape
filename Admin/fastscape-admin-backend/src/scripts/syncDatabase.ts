import '../config/env/envConfig';
import { initPostgres_DB, sequelize } from '../models';

/**
 * Script to sync database with alter: true
 * This will create tables if they don't exist and alter existing tables to match the models
 */
const syncDatabase = async (): Promise<void> => {
  try {
    // Initialize the database connection and models
    initPostgres_DB();
    
    console.log('Starting database synchronization with alter: true...');
    
    // Sync database with alter: true
    await sequelize.sync({ alter: true });
    
    console.log('Database synchronized successfully!');
    console.log('Tables have been created/updated to match the models.');
    
    // Close the connection
    await sequelize.close();
    console.log('Database connection closed.');
    
  } catch (error) {
    console.error('Error synchronizing database:', error);
    process.exit(1);
  }
};

// Run the sync
syncDatabase();
