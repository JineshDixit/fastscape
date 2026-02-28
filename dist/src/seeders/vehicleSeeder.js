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
exports.runVehicleSeeder = exports.seedVehiclesData = void 0;
require("../config/env/envConfig");
const models_1 = require("../models");
/**
 * Seed data for vehicles with realistic car information
 */
const seedVehicles = [
    // Luxury Sedans
    {
        make: 'BMW',
        model: '7 Series',
        trim: '750i xDrive',
        year: 2024,
        exteriorColor: 'Jet Black',
        interiorColor: 'Cognac Leather',
        bodyType: 'Sedan',
        transmission: 'Automatic',
        drivetrain: 'AWD',
        engine: '4.4L Twin-Turbo V8',
        horsepower: 523,
        fuelType: 'Petrol',
        fuelConsumption: '10.2L/100km',
        pricePerDay: 450.00,
        delayChargePerHour: 25.00,
        depositPercentage: 25.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 5,
    },
    {
        make: 'Mercedes-Benz',
        model: 'S-Class',
        trim: 'S 580',
        year: 2024,
        exteriorColor: 'Obsidian Black Metallic',
        interiorColor: 'Macchiato Beige',
        bodyType: 'Sedan',
        transmission: 'Automatic',
        drivetrain: 'RWD',
        engine: '4.0L Twin-Turbo V8',
        horsepower: 496,
        fuelType: 'Petrol',
        fuelConsumption: '9.8L/100km',
        pricePerDay: 480.00,
        delayChargePerHour: 28.00,
        depositPercentage: 25.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 5,
    },
    {
        make: 'Audi',
        model: 'A8',
        trim: 'L 60 TFSI quattro',
        year: 2023,
        exteriorColor: 'Glacier White Metallic',
        interiorColor: 'Black Valcona Leather',
        bodyType: 'Sedan',
        transmission: 'Automatic',
        drivetrain: 'AWD',
        engine: '4.0L TFSI V8',
        horsepower: 453,
        fuelType: 'Petrol',
        fuelConsumption: '9.6L/100km',
        pricePerDay: 420.00,
        delayChargePerHour: 24.00,
        depositPercentage: 25.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 5,
    },
    // Luxury SUVs
    {
        make: 'Range Rover',
        model: 'Autobiography',
        trim: 'P530',
        year: 2024,
        exteriorColor: 'Byron Blue Metallic',
        interiorColor: 'Ebony/Ivory Leather',
        bodyType: 'SUV',
        transmission: 'Automatic',
        drivetrain: '4x4',
        engine: '5.0L Supercharged V8',
        horsepower: 518,
        fuelType: 'Petrol',
        fuelConsumption: '13.1L/100km',
        pricePerDay: 520.00,
        delayChargePerHour: 30.00,
        depositPercentage: 30.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 5,
    },
    {
        make: 'Porsche',
        model: 'Cayenne',
        trim: 'Turbo GT',
        year: 2024,
        exteriorColor: 'Carrara White Metallic',
        interiorColor: 'Black/Bordeaux Red',
        bodyType: 'SUV',
        transmission: 'Automatic',
        drivetrain: 'AWD',
        engine: '4.0L Twin-Turbo V8',
        horsepower: 631,
        fuelType: 'Petrol',
        fuelConsumption: '11.9L/100km',
        pricePerDay: 580.00,
        delayChargePerHour: 35.00,
        depositPercentage: 30.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 5,
    },
    {
        make: 'BMW',
        model: 'X7',
        trim: 'xDrive40i',
        year: 2023,
        exteriorColor: 'Alpine White',
        interiorColor: 'Tartufo Leather',
        bodyType: 'SUV',
        transmission: 'Automatic',
        drivetrain: 'AWD',
        engine: '3.0L Twin-Turbo I6',
        horsepower: 375,
        fuelType: 'Petrol',
        fuelConsumption: '10.7L/100km',
        pricePerDay: 380.00,
        delayChargePerHour: 22.00,
        depositPercentage: 25.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 7,
    },
    // Supercars
    {
        make: 'Lamborghini',
        model: 'Huracán',
        trim: 'EVO Spyder',
        year: 2024,
        exteriorColor: 'Arancio Borealis',
        interiorColor: 'Nero Alde Leather',
        bodyType: 'Supercar',
        transmission: 'Automatic',
        drivetrain: 'AWD',
        engine: '5.2L V10',
        horsepower: 630,
        fuelType: 'Petrol',
        fuelConsumption: '14.9L/100km',
        pricePerDay: 1200.00,
        delayChargePerHour: 80.00,
        depositPercentage: 50.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 2,
    },
    {
        make: 'Ferrari',
        model: 'F8 Tributo',
        year: 2023,
        exteriorColor: 'Rosso Corsa',
        interiorColor: 'Nero Leather',
        bodyType: 'Supercar',
        transmission: 'Automatic',
        drivetrain: 'RWD',
        engine: '3.9L Twin-Turbo V8',
        horsepower: 710,
        fuelType: 'Petrol',
        fuelConsumption: '11.4L/100km',
        pricePerDay: 1500.00,
        delayChargePerHour: 100.00,
        depositPercentage: 50.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 2,
    },
    {
        make: 'McLaren',
        model: '720S',
        trim: 'Spider',
        year: 2023,
        exteriorColor: 'Volcano Orange',
        interiorColor: 'Carbon Black Alcantara',
        bodyType: 'Supercar',
        transmission: 'Automatic',
        drivetrain: 'RWD',
        engine: '4.0L Twin-Turbo V8',
        horsepower: 710,
        fuelType: 'Petrol',
        fuelConsumption: '10.7L/100km',
        pricePerDay: 1400.00,
        delayChargePerHour: 90.00,
        depositPercentage: 50.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 2,
    },
    // Luxury Coupes
    {
        make: 'Bentley',
        model: 'Continental GT',
        trim: 'V8',
        year: 2024,
        exteriorColor: 'Beluga Black',
        interiorColor: 'Linen Leather',
        bodyType: 'Coupe',
        transmission: 'Automatic',
        drivetrain: 'AWD',
        engine: '4.0L Twin-Turbo V8',
        horsepower: 542,
        fuelType: 'Petrol',
        fuelConsumption: '12.5L/100km',
        pricePerDay: 650.00,
        delayChargePerHour: 40.00,
        depositPercentage: 35.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 4,
    },
    {
        make: 'Aston Martin',
        model: 'DB11',
        trim: 'V8',
        year: 2023,
        exteriorColor: 'Magnetic Silver',
        interiorColor: 'Obsidian Black Leather',
        bodyType: 'Coupe',
        transmission: 'Automatic',
        drivetrain: 'RWD',
        engine: '4.0L Twin-Turbo V8',
        horsepower: 503,
        fuelType: 'Petrol',
        fuelConsumption: '11.4L/100km',
        pricePerDay: 750.00,
        delayChargePerHour: 45.00,
        depositPercentage: 40.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 4,
    },
    // Electric Vehicles
    {
        make: 'Tesla',
        model: 'Model S',
        trim: 'Plaid',
        year: 2024,
        exteriorColor: 'Pearl White Multi-Coat',
        interiorColor: 'Black Premium Interior',
        bodyType: 'Sedan',
        transmission: 'Automatic',
        drivetrain: 'AWD',
        engine: 'Tri-Motor Electric',
        horsepower: 1020,
        fuelType: 'Electric',
        fuelConsumption: '18.1 kWh/100km',
        pricePerDay: 320.00,
        delayChargePerHour: 20.00,
        depositPercentage: 20.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 5,
    },
    {
        make: 'Porsche',
        model: 'Taycan',
        trim: 'Turbo S',
        year: 2024,
        exteriorColor: 'Frozen Blue Metallic',
        interiorColor: 'Black Leather',
        bodyType: 'Sedan',
        transmission: 'Automatic',
        drivetrain: 'AWD',
        engine: 'Dual-Motor Electric',
        horsepower: 750,
        fuelType: 'Electric',
        fuelConsumption: '24.6 kWh/100km',
        pricePerDay: 450.00,
        delayChargePerHour: 28.00,
        depositPercentage: 25.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 4,
    },
    // Pickup Trucks
    {
        make: 'Ford',
        model: 'F-150',
        trim: 'Raptor',
        year: 2024,
        exteriorColor: 'Code Orange',
        interiorColor: 'Black Leather',
        bodyType: 'Pickup',
        transmission: 'Automatic',
        drivetrain: '4x4',
        engine: '3.5L Twin-Turbo V6',
        horsepower: 450,
        fuelType: 'Petrol',
        fuelConsumption: '14.4L/100km',
        pricePerDay: 280.00,
        delayChargePerHour: 18.00,
        depositPercentage: 20.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 5,
    },
    {
        make: 'RAM',
        model: '1500',
        trim: 'TRX',
        year: 2023,
        exteriorColor: 'Flame Red Clear Coat',
        interiorColor: 'Black/Red Leather',
        bodyType: 'Pickup',
        transmission: 'Automatic',
        drivetrain: '4x4',
        engine: '6.2L Supercharged V8',
        horsepower: 702,
        fuelType: 'Petrol',
        fuelConsumption: '18.1L/100km',
        pricePerDay: 350.00,
        delayChargePerHour: 22.00,
        depositPercentage: 25.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 5,
    },
    // Affordable Options
    {
        make: 'Toyota',
        model: 'Camry',
        trim: 'XSE',
        year: 2024,
        exteriorColor: 'Midnight Black Metallic',
        interiorColor: 'Black SofTex',
        bodyType: 'Sedan',
        transmission: 'Automatic',
        drivetrain: 'FWD',
        engine: '2.5L 4-Cylinder',
        horsepower: 203,
        fuelType: 'Petrol',
        fuelConsumption: '7.8L/100km',
        pricePerDay: 85.00,
        delayChargePerHour: 8.00,
        depositPercentage: 15.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 5,
    },
    {
        make: 'Honda',
        model: 'Accord',
        trim: 'Sport',
        year: 2024,
        exteriorColor: 'Still Night Pearl',
        interiorColor: 'Black Cloth',
        bodyType: 'Sedan',
        transmission: 'Automatic',
        drivetrain: 'FWD',
        engine: '1.5L Turbo 4-Cylinder',
        horsepower: 192,
        fuelType: 'Petrol',
        fuelConsumption: '7.4L/100km',
        pricePerDay: 80.00,
        delayChargePerHour: 7.50,
        depositPercentage: 15.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 5,
    },
    {
        make: 'Nissan',
        model: 'Altima',
        trim: 'SR',
        year: 2023,
        exteriorColor: 'Super Black',
        interiorColor: 'Charcoal Cloth',
        bodyType: 'Sedan',
        transmission: 'Automatic',
        drivetrain: 'FWD',
        engine: '2.5L 4-Cylinder',
        horsepower: 188,
        fuelType: 'Petrol',
        fuelConsumption: '7.6L/100km',
        pricePerDay: 75.00,
        delayChargePerHour: 7.00,
        depositPercentage: 15.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 5,
    },
    // Hybrid Vehicles
    {
        make: 'Toyota',
        model: 'Prius',
        trim: 'Limited',
        year: 2024,
        exteriorColor: 'Blueprint',
        interiorColor: 'Black SofTex',
        bodyType: 'Hatchback',
        transmission: 'Automatic',
        drivetrain: 'FWD',
        engine: '2.0L Hybrid 4-Cylinder',
        horsepower: 194,
        fuelType: 'Hybrid',
        fuelConsumption: '4.4L/100km',
        pricePerDay: 95.00,
        delayChargePerHour: 9.00,
        depositPercentage: 15.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 5,
    },
    {
        make: 'Lexus',
        model: 'ES',
        trim: '300h',
        year: 2024,
        exteriorColor: 'Atomic Silver',
        interiorColor: 'Black NuLuxe',
        bodyType: 'Sedan',
        transmission: 'Automatic',
        drivetrain: 'FWD',
        engine: '2.5L Hybrid 4-Cylinder',
        horsepower: 215,
        fuelType: 'Hybrid',
        fuelConsumption: '5.8L/100km',
        pricePerDay: 150.00,
        delayChargePerHour: 12.00,
        depositPercentage: 18.00,
        currency: 'USD',
        isAvailable: true,
        passengerCapacity: 5,
    },
];
/**
 * Seed vehicles into the database
 */
const seedVehiclesData = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🌱 Seeding vehicles...');
    for (const vehicleData of seedVehicles) {
        const existingVehicle = yield models_1.Vehicle.findOne({
            where: {
                make: vehicleData.make,
                model: vehicleData.model,
                year: vehicleData.year,
                trim: vehicleData.trim || null,
            }
        });
        if (!existingVehicle) {
            yield models_1.Vehicle.create(vehicleData);
            console.log(`✅ Created vehicle: ${vehicleData.year} ${vehicleData.make} ${vehicleData.model} ${vehicleData.trim || ''}`);
        }
        else {
            console.log(`⚠️  Vehicle already exists: ${vehicleData.year} ${vehicleData.make} ${vehicleData.model} ${vehicleData.trim || ''}`);
        }
    }
    console.log('✅ Vehicles seeded successfully');
});
exports.seedVehiclesData = seedVehiclesData;
/**
 * Main seeder function
 */
const runVehicleSeeder = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🚀 Starting vehicle seeder...');
        yield (0, exports.seedVehiclesData)();
        console.log('🎉 Vehicle seeder completed successfully!');
        console.log(`\n📊 Seeded ${seedVehicles.length} vehicles across different categories:`);
        console.log('┌─────────────────────────────────────────────────────────────┐');
        console.log('│ Category        │ Count │ Price Range (USD/day)           │');
        console.log('├─────────────────────────────────────────────────────────────┤');
        console.log('│ Luxury Sedans   │   3   │ $420 - $480                     │');
        console.log('│ Luxury SUVs     │   3   │ $380 - $580                     │');
        console.log('│ Supercars       │   3   │ $1,200 - $1,500                 │');
        console.log('│ Luxury Coupes   │   2   │ $650 - $750                     │');
        console.log('│ Electric        │   2   │ $320 - $450                     │');
        console.log('│ Pickup Trucks   │   2   │ $280 - $350                     │');
        console.log('│ Affordable      │   3   │ $75 - $85                       │');
        console.log('│ Hybrid          │   2   │ $95 - $150                      │');
        console.log('└─────────────────────────────────────────────────────────────┘');
        console.log('\n🚗 Vehicle inventory is now ready for bookings!');
    }
    catch (error) {
        console.error('❌ Vehicle seeder failed:', error);
        throw error;
    }
});
exports.runVehicleSeeder = runVehicleSeeder;
/**
 * Main execution function
 */
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🔧 Initializing database connection...');
        // Initialize database
        (0, models_1.initPostgres_DB)();
        // Wait a moment for database to initialize
        yield new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Database connection established');
        // Run vehicle seeder
        yield (0, exports.runVehicleSeeder)();
        console.log('\n🎉 Seeder completed successfully!');
        console.log('🔚 Exiting...');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Seeder failed:', error);
        process.exit(1);
    }
});
// Run seeder if this file is executed directly
if (require.main === module) {
    main();
}
//# sourceMappingURL=vehicleSeeder.js.map