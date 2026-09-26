"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initUserDrivingInfoModel = exports.UserDrivingInfo = void 0;
const sequelize_1 = require("sequelize");
const dbEnums_1 = require("../common/enum/dbEnums");
class UserDrivingInfo extends sequelize_1.Model {
}
exports.UserDrivingInfo = UserDrivingInfo;
const initUserDrivingInfoModel = (sequelize) => {
    UserDrivingInfo.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            unique: true, // One driving info per user
            references: {
                model: 'users',
                key: 'id',
            },
        },
        licenseIssuingCountry: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 100],
            },
        },
        licenseExpiryDate: {
            type: sequelize_1.DataTypes.DATEONLY,
            allowNull: false,
            validate: {
                isDate: true,
                isAfter: new Date().toISOString().split('T')[0], // Must be in the future
            },
        },
        drivingExperienceYears: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
                max: 80, // Reasonable maximum
            },
        },
        visaStatus: {
            type: sequelize_1.DataTypes.ENUM(...dbEnums_1.dbEnums.VISA_STATUS),
            allowNull: false,
        },
        isVerified: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        verificationDate: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
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
        tableName: 'user_driving_info',
        modelName: 'UserDrivingInfo',
        validate: {
            // Custom validation to ensure license is not expired
            licenseNotExpired() {
                if (this.licenseExpiryDate && new Date(this.licenseExpiryDate) <= new Date()) {
                    throw new Error('License expiry date must be in the future');
                }
            },
        },
    });
};
exports.initUserDrivingInfoModel = initUserDrivingInfoModel;
//# sourceMappingURL=userDrivingInfo.model.js.map