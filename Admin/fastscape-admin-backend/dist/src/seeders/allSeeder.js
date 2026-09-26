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
exports.runAllSeeders = void 0;
require("../config/env/envConfig");
const models_1 = require("../models");
const adminSeeder_1 = require("./adminSeeder");
const vehicleSeeder_1 = require("./vehicleSeeder");
const chauffeurSeeder_1 = require("./chauffeurSeeder");
/**
 * Run all seeders in the correct order
 */
const runAllSeeders = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🚀 Starting complete database seeding...');
        console.log('═══════════════════════════════════════════════════════════════');
        // Run admin seeder first (creates roles, policies, and admin users)
        console.log('\n1️⃣  Running Admin Seeder...');
        yield (0, adminSeeder_1.runAdminSeeder)();
        console.log('\n═══════════════════════════════════════════════════════════════');
        // Run vehicle seeder
        console.log('\n2️⃣  Running Vehicle Seeder...');
        yield (0, vehicleSeeder_1.runVehicleSeeder)();
        console.log('\n═══════════════════════════════════════════════════════════════');
        // Run chauffeur seeder
        console.log('\n3️⃣  Running Chauffeur Seeder...');
        yield (0, chauffeurSeeder_1.runChauffeurSeeder)();
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('🎉 All seeders completed successfully!');
        console.log('\n📋 Database is now fully populated with:');
        console.log('  ✅ Admin users, roles, and policies');
        console.log('  ✅ 20 diverse vehicles across all categories');
        console.log('  ✅ 5 professional chauffeurs');
        console.log('\n🚀 Your Fastscape Admin system is ready to use!');
    }
    catch (error) {
        console.error('❌ Seeding process failed:', error);
        throw error;
    }
});
exports.runAllSeeders = runAllSeeders;
/**
 * Main execution function
 */
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🔧 Initializing database connection...');
        // Initialize database
        (0, models_1.initPostgres_DB)();
        // Wait a moment for database to initialize
        yield new Promise((resolve) => setTimeout(resolve, 2000));
        console.log('✅ Database connection established');
        // Run all seeders
        yield runAllSeeders();
        console.log('\n🔚 Exiting...');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Complete seeding failed:', error);
        process.exit(1);
    }
});
// Run seeder if this file is executed directly
if (require.main === module) {
    main();
}
//# sourceMappingURL=allSeeder.js.map