"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initBookingModel = exports.Booking = void 0;
const sequelize_1 = require("sequelize");
const dbEnums_1 = require("../common/enum/dbEnums");
class Booking extends sequelize_1.Model {
}
exports.Booking = Booking;
const initBookingModel = (sequelize) => {
    Booking.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        vehicleId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'vehicles',
                key: 'id',
            },
        },
        chauffeurId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'chauffeurs',
                key: 'id',
            },
        },
        startDatetime: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        endDatetime: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        actualPickupDatetime: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        actualDropoffDatetime: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        pickupLocation: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        dropoffLocation: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        bookingType: {
            type: sequelize_1.DataTypes.ENUM(...dbEnums_1.dbEnums.BOOKING_TYPE),
            allowNull: false,
            defaultValue: 'SELF_DRIVE',
        },
        bookingStatus: {
            type: sequelize_1.DataTypes.ENUM(...dbEnums_1.dbEnums.BOOKING_STATUS),
            defaultValue: 'PENDING',
        },
        paymentStatus: {
            type: sequelize_1.DataTypes.ENUM(...dbEnums_1.dbEnums.PAYMENT_STATUS),
            defaultValue: 'UNPAID',
        },
        paymentMethod: {
            type: sequelize_1.DataTypes.ENUM(...dbEnums_1.dbEnums.PAYMENT_METHOD),
            allowNull: false,
            defaultValue: 'ONLINE',
        },
        delayChargeApplied: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        delayHours: {
            type: sequelize_1.DataTypes.DECIMAL(5, 2),
            defaultValue: 0,
        },
        chauffeurInstructions: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            comment: 'Special instructions for the chauffeur',
        },
        notes: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        expiresAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when the pending booking expires',
        },
        version: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Version field for optimistic locking',
        },
    }, {
        sequelize,
        freezeTableName: true,
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        underscored: true,
        tableName: 'bookings',
        modelName: 'Booking',
    });
};
exports.initBookingModel = initBookingModel;
//# sourceMappingURL=booking.model.js.map