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
exports.runChauffeurSeeder = exports.seedChauffeursData = void 0;
require("../config/env/envConfig");
const models_1 = require("../models");
/**
 * Seed data for chauffeurs
 */
const seedChauffeurs = [
    {
        fullName: 'James Anderson',
        email: 'james.anderson@fastscape.com',
        phone: '+1-555-0101',
        dateOfBirth: new Date('1985-03-15'),
        nationality: 'American',
        profilePhoto: 'https://example.com/photos/james-anderson.jpg',
        licenseNumber: 'DL-USA-12345678',
        licenseExpiryDate: new Date('2027-03-15'),
        licenseIssuingCountry: 'United States',
        experienceLevel: 'EXPERT',
        yearsOfExperience: 15,
        languages: ['English', 'Spanish'],
        specializations: ['Sedan', 'SUV', 'Supercar'],
        hourlyRate: 45.0,
        currency: 'USD',
        status: 'AVAILABLE',
        rating: 4.9,
        totalTrips: 1250,
        isVerified: true,
        emergencyContactName: 'Sarah Anderson',
        emergencyContactPhone: '+1-555-0102',
        address: '123 Main Street, Apt 4B',
        city: 'Los Angeles',
        state: 'California',
        zipCode: '90001',
        country: 'United States',
        notes: 'Specializes in luxury vehicles and VIP clients. Excellent safety record.',
        joinedAt: new Date('2020-01-15'),
        lastActiveAt: new Date(),
    },
    {
        fullName: 'Mohammed Al-Rashid',
        email: 'mohammed.rashid@fastscape.com',
        phone: '+971-555-0201',
        dateOfBirth: new Date('1990-07-22'),
        nationality: 'Emirati',
        profilePhoto: 'https://example.com/photos/mohammed-rashid.jpg',
        licenseNumber: 'DL-UAE-87654321',
        licenseExpiryDate: new Date('2026-07-22'),
        licenseIssuingCountry: 'United Arab Emirates',
        experienceLevel: 'EXPERIENCED',
        yearsOfExperience: 8,
        languages: ['Arabic', 'English', 'French'],
        specializations: ['SUV', 'Sedan', 'Pickup'],
        hourlyRate: 38.0,
        currency: 'USD',
        status: 'AVAILABLE',
        rating: 4.8,
        totalTrips: 680,
        isVerified: true,
        emergencyContactName: 'Fatima Al-Rashid',
        emergencyContactPhone: '+971-555-0202',
        address: 'Al Barsha District, Building 7',
        city: 'Dubai',
        state: 'Dubai',
        zipCode: '00000',
        country: 'United Arab Emirates',
        notes: 'Multilingual driver with excellent knowledge of Dubai and Abu Dhabi.',
        joinedAt: new Date('2021-06-10'),
        lastActiveAt: new Date(),
    },
    {
        fullName: 'Carlos Rodriguez',
        email: 'carlos.rodriguez@fastscape.com',
        phone: '+34-555-0301',
        dateOfBirth: new Date('1988-11-08'),
        nationality: 'Spanish',
        profilePhoto: 'https://example.com/photos/carlos-rodriguez.jpg',
        licenseNumber: 'DL-ESP-11223344',
        licenseExpiryDate: new Date('2028-11-08'),
        licenseIssuingCountry: 'Spain',
        experienceLevel: 'EXPERIENCED',
        yearsOfExperience: 10,
        languages: ['Spanish', 'English', 'Portuguese'],
        specializations: ['Sedan', 'Coupe', 'Supercar'],
        hourlyRate: 42.0,
        currency: 'USD',
        status: 'AVAILABLE',
        rating: 4.7,
        totalTrips: 890,
        isVerified: true,
        emergencyContactName: 'Maria Rodriguez',
        emergencyContactPhone: '+34-555-0302',
        address: 'Calle Mayor 45, 3rd Floor',
        city: 'Madrid',
        state: 'Madrid',
        zipCode: '28013',
        country: 'Spain',
        notes: 'Expert in sports cars and high-performance vehicles.',
        joinedAt: new Date('2020-09-20'),
        lastActiveAt: new Date(),
    },
    {
        fullName: 'Yuki Tanaka',
        email: 'yuki.tanaka@fastscape.com',
        phone: '+81-555-0401',
        dateOfBirth: new Date('1992-05-30'),
        nationality: 'Japanese',
        profilePhoto: 'https://example.com/photos/yuki-tanaka.jpg',
        licenseNumber: 'DL-JPN-99887766',
        licenseExpiryDate: new Date('2027-05-30'),
        licenseIssuingCountry: 'Japan',
        experienceLevel: 'INTERMEDIATE',
        yearsOfExperience: 6,
        languages: ['Japanese', 'English'],
        specializations: ['Sedan', 'SUV', 'Hatchback'],
        hourlyRate: 35.0,
        currency: 'USD',
        status: 'AVAILABLE',
        rating: 4.6,
        totalTrips: 420,
        isVerified: true,
        emergencyContactName: 'Hiroshi Tanaka',
        emergencyContactPhone: '+81-555-0402',
        address: 'Shibuya-ku, 2-21-1',
        city: 'Tokyo',
        state: 'Tokyo',
        zipCode: '150-0002',
        country: 'Japan',
        notes: 'Punctual and professional. Excellent city navigation skills.',
        joinedAt: new Date('2022-03-12'),
        lastActiveAt: new Date(),
    },
    {
        fullName: 'Emma Thompson',
        email: 'emma.thompson@fastscape.com',
        phone: '+44-555-0501',
        dateOfBirth: new Date('1987-09-14'),
        nationality: 'British',
        profilePhoto: 'https://example.com/photos/emma-thompson.jpg',
        licenseNumber: 'DL-GBR-55667788',
        licenseExpiryDate: new Date('2029-09-14'),
        licenseIssuingCountry: 'United Kingdom',
        experienceLevel: 'EXPERIENCED',
        yearsOfExperience: 12,
        languages: ['English', 'French', 'German'],
        specializations: ['Sedan', 'SUV'],
        hourlyRate: 40.0,
        currency: 'USD',
        status: 'AVAILABLE',
        rating: 4.9,
        totalTrips: 1050,
        isVerified: true,
        emergencyContactName: 'David Thompson',
        emergencyContactPhone: '+44-555-0502',
        address: '78 Baker Street',
        city: 'London',
        state: 'Greater London',
        zipCode: 'NW1 6XE',
        country: 'United Kingdom',
        notes: 'Professional chauffeur with extensive experience in corporate transport.',
        joinedAt: new Date('2019-11-05'),
        lastActiveAt: new Date(),
    },
    {
        fullName: 'Pierre Dubois',
        email: 'pierre.dubois@fastscape.com',
        phone: '+33-555-0601',
        dateOfBirth: new Date('1995-02-18'),
        nationality: 'French',
        profilePhoto: 'https://example.com/photos/pierre-dubois.jpg',
        licenseNumber: 'DL-FRA-33445566',
        licenseExpiryDate: new Date('2026-02-18'),
        licenseIssuingCountry: 'France',
        experienceLevel: 'INTERMEDIATE',
        yearsOfExperience: 5,
        languages: ['French', 'English', 'Italian'],
        specializations: ['Sedan', 'Coupe'],
        hourlyRate: 32.0,
        currency: 'USD',
        status: 'AVAILABLE',
        rating: 4.5,
        totalTrips: 310,
        isVerified: true,
        emergencyContactName: 'Sophie Dubois',
        emergencyContactPhone: '+33-555-0602',
        address: '15 Rue de Rivoli',
        city: 'Paris',
        state: 'Île-de-France',
        zipCode: '75001',
        country: 'France',
        notes: 'Young and energetic driver with good customer service skills.',
        joinedAt: new Date('2023-01-20'),
        lastActiveAt: new Date(),
    },
    {
        fullName: 'Michael Chen',
        email: 'michael.chen@fastscape.com',
        phone: '+65-555-0701',
        dateOfBirth: new Date('1989-12-03'),
        nationality: 'Singaporean',
        profilePhoto: 'https://example.com/photos/michael-chen.jpg',
        licenseNumber: 'DL-SGP-22334455',
        licenseExpiryDate: new Date('2027-12-03'),
        licenseIssuingCountry: 'Singapore',
        experienceLevel: 'EXPERIENCED',
        yearsOfExperience: 9,
        languages: ['English', 'Mandarin', 'Malay'],
        specializations: ['Sedan', 'SUV', 'Pickup'],
        hourlyRate: 36.0,
        currency: 'USD',
        status: 'BUSY',
        rating: 4.8,
        totalTrips: 720,
        isVerified: true,
        emergencyContactName: 'Linda Chen',
        emergencyContactPhone: '+65-555-0702',
        address: 'Orchard Road, Block 123',
        city: 'Singapore',
        state: 'Central Region',
        zipCode: '238858',
        country: 'Singapore',
        notes: 'Reliable and experienced. Currently on an active booking.',
        joinedAt: new Date('2021-04-15'),
        lastActiveAt: new Date(),
    },
    {
        fullName: 'Sofia Martinez',
        email: 'sofia.martinez@fastscape.com',
        phone: '+52-555-0801',
        dateOfBirth: new Date('1993-08-25'),
        nationality: 'Mexican',
        profilePhoto: 'https://example.com/photos/sofia-martinez.jpg',
        licenseNumber: 'DL-MEX-66778899',
        licenseExpiryDate: new Date('2028-08-25'),
        licenseIssuingCountry: 'Mexico',
        experienceLevel: 'INTERMEDIATE',
        yearsOfExperience: 7,
        languages: ['Spanish', 'English'],
        specializations: ['SUV', 'Sedan', 'Pickup'],
        hourlyRate: 30.0,
        currency: 'USD',
        status: 'AVAILABLE',
        rating: 4.7,
        totalTrips: 540,
        isVerified: true,
        emergencyContactName: 'Juan Martinez',
        emergencyContactPhone: '+52-555-0802',
        address: 'Avenida Reforma 456',
        city: 'Mexico City',
        state: 'Mexico City',
        zipCode: '06600',
        country: 'Mexico',
        notes: 'Friendly and professional. Great knowledge of local routes.',
        joinedAt: new Date('2022-07-08'),
        lastActiveAt: new Date(),
    },
    {
        fullName: 'David Kim',
        email: 'david.kim@fastscape.com',
        phone: '+82-555-0901',
        dateOfBirth: new Date('1991-04-12'),
        nationality: 'South Korean',
        profilePhoto: 'https://example.com/photos/david-kim.jpg',
        licenseNumber: 'DL-KOR-44556677',
        licenseExpiryDate: new Date('2026-04-12'),
        licenseIssuingCountry: 'South Korea',
        experienceLevel: 'BEGINNER',
        yearsOfExperience: 3,
        languages: ['Korean', 'English'],
        specializations: ['Sedan', 'Hatchback'],
        hourlyRate: 25.0,
        currency: 'USD',
        status: 'AVAILABLE',
        rating: 4.4,
        totalTrips: 180,
        isVerified: true,
        emergencyContactName: 'Sarah Kim',
        emergencyContactPhone: '+82-555-0902',
        address: 'Gangnam-gu, 789 Street',
        city: 'Seoul',
        state: 'Seoul',
        zipCode: '06000',
        country: 'South Korea',
        notes: 'New to the platform but eager to learn and provide excellent service.',
        joinedAt: new Date('2024-02-01'),
        lastActiveAt: new Date(),
    },
    {
        fullName: 'Alessandro Rossi',
        email: 'alessandro.rossi@fastscape.com',
        phone: '+39-555-1001',
        dateOfBirth: new Date('1986-06-20'),
        nationality: 'Italian',
        profilePhoto: 'https://example.com/photos/alessandro-rossi.jpg',
        licenseNumber: 'DL-ITA-77889900',
        licenseExpiryDate: new Date('2027-06-20'),
        licenseIssuingCountry: 'Italy',
        experienceLevel: 'EXPERT',
        yearsOfExperience: 14,
        languages: ['Italian', 'English', 'Spanish'],
        specializations: ['Supercar', 'Coupe', 'Sedan'],
        hourlyRate: 48.0,
        currency: 'USD',
        status: 'OFF_DUTY',
        rating: 5.0,
        totalTrips: 1420,
        isVerified: true,
        emergencyContactName: 'Francesca Rossi',
        emergencyContactPhone: '+39-555-1002',
        address: 'Via Roma 234',
        city: 'Milan',
        state: 'Lombardy',
        zipCode: '20121',
        country: 'Italy',
        notes: 'Expert in luxury and exotic vehicles. Currently off duty for scheduled break.',
        joinedAt: new Date('2019-05-10'),
        lastActiveAt: new Date('2024-02-15'),
    },
];
/**
 * Seed chauffeurs
 */
const seedChauffeursData = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🌱 Seeding chauffeurs...');
    for (const chauffeurData of seedChauffeurs) {
        const existingChauffeur = yield models_1.Chauffeur.findOne({ where: { email: chauffeurData.email } });
        if (!existingChauffeur) {
            yield models_1.Chauffeur.create(chauffeurData);
            console.log(`✅ Created chauffeur: ${chauffeurData.fullName} (${chauffeurData.email})`);
        }
        else {
            // Update existing chauffeur
            yield existingChauffeur.update(chauffeurData);
            console.log(`🔄 Updated chauffeur: ${chauffeurData.fullName} (${chauffeurData.email})`);
        }
    }
    console.log('✅ Chauffeurs seeded successfully');
});
exports.seedChauffeursData = seedChauffeursData;
/**
 * Main seeder function
 */
const runChauffeurSeeder = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🚀 Starting chauffeur seeder...');
        yield (0, exports.seedChauffeursData)();
        console.log('🎉 Chauffeur seeder completed successfully!');
        console.log('\n📋 Created Chauffeurs Summary:');
        console.log('┌────────────────────────────────────────────────────────────────────────────┐');
        console.log('│ Name                  │ Email                           │ Experience Level │');
        console.log('├────────────────────────────────────────────────────────────────────────────┤');
        console.log('│ James Anderson        │ james.anderson@fastscape.com    │ EXPERT          │');
        console.log('│ Mohammed Al-Rashid    │ mohammed.rashid@fastscape.com   │ EXPERIENCED     │');
        console.log('│ Carlos Rodriguez      │ carlos.rodriguez@fastscape.com  │ EXPERIENCED     │');
        console.log('│ Yuki Tanaka           │ yuki.tanaka@fastscape.com       │ INTERMEDIATE    │');
        console.log('│ Emma Thompson         │ emma.thompson@fastscape.com     │ EXPERIENCED     │');
        console.log('│ Pierre Dubois         │ pierre.dubois@fastscape.com     │ INTERMEDIATE    │');
        console.log('│ Michael Chen          │ michael.chen@fastscape.com      │ EXPERIENCED     │');
        console.log('│ Sofia Martinez        │ sofia.martinez@fastscape.com    │ INTERMEDIATE    │');
        console.log('│ David Kim             │ david.kim@fastscape.com         │ BEGINNER        │');
        console.log('│ Alessandro Rossi      │ alessandro.rossi@fastscape.com  │ EXPERT          │');
        console.log('└────────────────────────────────────────────────────────────────────────────┘');
        console.log('\n🚗 Total: 10 chauffeurs with diverse experience levels and specializations.');
    }
    catch (error) {
        console.error('❌ Chauffeur seeder failed:', error);
        throw error;
    }
});
exports.runChauffeurSeeder = runChauffeurSeeder;
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
        // Run chauffeur seeder
        yield (0, exports.runChauffeurSeeder)();
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
//# sourceMappingURL=chauffeurSeeder.js.map