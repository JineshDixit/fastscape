"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAddressModel = exports.Address = void 0;
const sequelize_1 = require("sequelize");
class Address extends sequelize_1.Model {
}
exports.Address = Address;
const initAddressModel = (sequelize) => {
    Address.init({
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
            onDelete: 'CASCADE',
        },
        type: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'Home', // e.g., Home, Work, Other
        },
        addressLine1: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
        },
        addressLine2: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: true,
        },
        city: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
        },
        state: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
        },
        zipCode: {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: false,
        },
        country: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
        },
        isDefault: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
    }, {
        sequelize,
        freezeTableName: true,
        timestamps: true,
        underscored: true,
        tableName: 'addresses',
        modelName: 'Address',
    });
};
exports.initAddressModel = initAddressModel;
//# sourceMappingURL=address.model.js.map