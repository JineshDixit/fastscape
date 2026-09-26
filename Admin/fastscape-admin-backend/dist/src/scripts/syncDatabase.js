"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("../config/env/envConfig");
const models_1 = require("../models");
/**
 * Script to sync database with alter: true
 * This will create tables if they don't exist and alter existing tables to match the models
 */
const syncDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Initialize the database connection and models
        (0, models_1.initPostgres_DB)();
        console.log('Starting database synchronization with alter: true...');
        // Sync database with alter: true
        yield models_1.sequelize.sync({ alter: true });
        console.log('Database synchronized successfully!');
        console.log('Tables have been created/updated to match the models.');
        // Close the connection
        yield models_1.sequelize.close();
        console.log('Database connection closed.');
    }
    catch (error) {
        console.error('Error synchronizing database:', error);
        process.exit(1);
    }
});
// Run the sync
syncDatabase();
//# sourceMappingURL=syncDatabase.js.map