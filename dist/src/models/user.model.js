"use strict";
/*
 * ALTER TABLE users ADD COLUMN reset_password_otp VARCHAR(255);
 * ALTER TABLE users ADD COLUMN reset_password_otp_expires TIMESTAMP WITH TIME ZONE;
 * ALTER TABLE users ADD COLUMN verification_status VARCHAR(50) DEFAULT 'PENDING';
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initUserModel = exports.User = void 0;
const sequelize_1 = require("sequelize");
class User extends sequelize_1.Model {
}
exports.User = User;
const initUserModel = (sequelize) => {
    User.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        firstName: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: false,
        },
        lastName: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: false,
        },
        dateOfBirth: {
            type: sequelize_1.DataTypes.DATEONLY,
            allowNull: false,
        },
        nationality: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: true,
        },
        email: {
            type: sequelize_1.DataTypes.STRING(150),
            unique: true,
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        phone: {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: true,
        },
        passwordHash: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        city: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: true,
        },
        state: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: true,
        },
        zipCode: {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: true,
        },
        country: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: true,
        },
        isBlocked: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        resetPasswordOtp: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        resetPasswordOtpExpires: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        verificationStatus: {
            type: sequelize_1.DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
            defaultValue: 'PENDING',
        },
        verificationDate: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
    }, {
        sequelize,
        freezeTableName: true,
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        underscored: true,
        tableName: 'users',
        modelName: 'User',
        indexes: [
            {
                fields: ['email'],
                unique: true,
            },
            {
                fields: ['phone'],
            },
            {
                fields: ['city', 'state'],
            },
            {
                fields: ['country'],
            },
            {
                fields: ['is_blocked'],
            },
        ],
    });
};
exports.initUserModel = initUserModel;
//# sourceMappingURL=user.model.js.map