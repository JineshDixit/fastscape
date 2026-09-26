"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vehicle_service_1 = require("../services/vehicle/vehicle.service");
// Mock the models
jest.mock('../models/vehicle.model');
jest.mock('../models/vehicleMedia.model');
describe('VehicleService', () => {
    let vehicleService;
    beforeEach(() => {
        vehicleService = new vehicle_service_1.VehicleService();
    });
    describe('getImageUrl', () => {
        it('should return empty string for empty path', () => {
            const result = vehicleService.getImageUrl('');
            expect(result).toBe('');
        });
        it('should return full URL for valid path', () => {
            const imagePath = 'uploads/vehicles/123/front.jpg';
            const result = vehicleService.getImageUrl(imagePath);
            expect(result).toBe('http://localhost:3000/uploads/vehicles/123/front.jpg');
        });
        it('should use BASE_URL from environment if available', () => {
            const originalBaseUrl = process.env.BASE_URL;
            process.env.BASE_URL = 'https://api.example.com';
            const imagePath = 'uploads/vehicles/123/front.jpg';
            const result = vehicleService.getImageUrl(imagePath);
            expect(result).toBe('https://api.example.com/uploads/vehicles/123/front.jpg');
            // Restore original value
            process.env.BASE_URL = originalBaseUrl;
        });
    });
    describe('getFileExtension', () => {
        it('should return correct extension for various filenames', () => {
            // Access private method for testing
            const getFileExtension = vehicleService.getFileExtension.bind(vehicleService);
            expect(getFileExtension('image.jpg')).toBe('jpg');
            expect(getFileExtension('image.PNG')).toBe('png');
            expect(getFileExtension('image.jpeg')).toBe('jpeg');
            expect(getFileExtension('image.webp')).toBe('webp');
            expect(getFileExtension('image')).toBe('jpg'); // default
        });
    });
});
//# sourceMappingURL=vehicle.test.js.map