"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPaymentModel = exports.Payment = void 0;
const sequelize_1 = require("sequelize");
const dbEnums_1 = require("../common/enum/dbEnums");
class Payment extends sequelize_1.Model {
}
exports.Payment = Payment;
const initPaymentModel = (sequelize) => {
    Payment.init({
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
        userId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        amount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        gatewayFeeAmount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            comment: 'Fees deducted by the payment gateway (e.g., Stripe fees)',
        },
        platformChargeAmount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            comment: 'Portion of this payment allocated to platform charges',
        },
        currency: {
            type: sequelize_1.DataTypes.STRING(3),
            allowNull: false,
            defaultValue: 'USD',
        },
        stripePaymentIntentId: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: true,
        },
        stripeChargeId: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: true,
        },
        stripeRefundId: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: true,
        },
        paymentType: {
            type: sequelize_1.DataTypes.ENUM(...dbEnums_1.dbEnums.PAYMENT_TYPE),
            allowNull: false,
        },
        paymentStatus: {
            type: sequelize_1.DataTypes.ENUM(...dbEnums_1.dbEnums.PAYMENT_STATUS),
            allowNull: false,
            defaultValue: 'UNPAID',
        },
        paymentMethod: {
            type: sequelize_1.DataTypes.ENUM(...dbEnums_1.dbEnums.PAYMENT_METHOD),
            allowNull: false,
            defaultValue: 'ONLINE',
        },
        metadata: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
        },
        paidAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        failureReason: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        sequelize,
        freezeTableName: true,
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        underscored: true,
        tableName: 'payments',
        modelName: 'Payment',
    });
};
exports.initPaymentModel = initPaymentModel;
//# sourceMappingURL=payment.model.js.map