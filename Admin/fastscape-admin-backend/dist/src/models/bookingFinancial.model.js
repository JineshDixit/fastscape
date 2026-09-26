"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initBookingFinancialModel = exports.BookingFinancial = void 0;
const sequelize_1 = require("sequelize");
class BookingFinancial extends sequelize_1.Model {
}
exports.BookingFinancial = BookingFinancial;
const initBookingFinancialModel = (sequelize) => {
    BookingFinancial.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        bookingId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'bookings',
                key: 'id',
            },
        },
        baseAmount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        chauffeurAmount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            comment: 'Total cost for chauffeur service',
        },
        chauffeurHours: {
            type: sequelize_1.DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0,
            comment: 'Total hours of chauffeur service',
        },
        depositAmount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        balanceAmount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        delayChargeAmount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        },
        delayChargeRate: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Charge per hour for delay',
        },
        taxAmount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        },
        platformChargeAmount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            comment: 'Total platform/gateway charges collected from user',
        },
        platformChargeRate: {
            type: sequelize_1.DataTypes.DECIMAL(5, 2),
            defaultValue: 0,
            comment: 'Percentage rate used to calculate platform charges',
        },
        totalAmount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        paidAmount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        },
        remainingAmount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        currency: {
            type: sequelize_1.DataTypes.STRING(3),
            allowNull: false,
            defaultValue: 'USD',
        },
        refundPolicy: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        refundableUntil: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        depositPercentage: {
            type: sequelize_1.DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 20.0,
            comment: 'Percentage of base amount for deposit',
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
        tableName: 'booking_financials',
        modelName: 'BookingFinancial',
    });
};
exports.initBookingFinancialModel = initBookingFinancialModel;
//# sourceMappingURL=bookingFinancial.model.js.map