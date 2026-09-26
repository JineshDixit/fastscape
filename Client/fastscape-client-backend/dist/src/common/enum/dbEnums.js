"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbEnums = void 0;
exports.dbEnums = {
    VEHICLE_BODY_TYPE: ['SUV', 'Sedan', 'Coupe', 'Supercar', 'Pickup', 'Hatchback'],
    TRANSMISSION_TYPE: ['Automatic', 'Manual'],
    DRIVETRAIN_TYPE: ['AWD', 'RWD', 'FWD', '4x4'],
    FUEL_TYPE: ['Petrol', 'Diesel', 'Hybrid', 'Electric'],
    VISA_STATUS: ['Resident', 'Tourist', 'Visit'],
    BOOKING_STATUS: ['PENDING', 'CONFIRMED', 'PICKED_UP', 'DROPPED_OFF', 'CANCELLED', 'COMPLETED'],
    PAYMENT_STATUS: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED', 'OVERDUE'],
    PAYMENT_TYPE: ['DEPOSIT', 'BALANCE', 'DELAY_CHARGE', 'REFUND', 'FULL'],
    PAYMENT_METHOD: ['PICKUP', 'DROPOFF', 'ONLINE'],
    BOOKING_TYPE: ['SELF_DRIVE', 'CHAUFFEUR'],
    CHAUFFEUR_STATUS: ['AVAILABLE', 'BUSY', 'OFF_DUTY', 'ON_BREAK'],
    CHAUFFEUR_EXPERIENCE: ['BEGINNER', 'INTERMEDIATE', 'EXPERIENCED', 'EXPERT'],
    STRIPE_PAYMENT_STATUS: ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'],
    VERIFICATION_STATUS: ['PENDING', 'VERIFIED', 'REJECTED'],
    DOCUMENT_TYPE: [
        'DRIVER_LICENSE_FRONT',
        'DRIVER_LICENSE_BACK',
        'PASSPORT_PHOTO',
        'INTERNATIONAL_DRIVING_PERMIT',
        'SELFIE_WITH_LICENSE',
    ],
};
//# sourceMappingURL=dbEnums.js.map