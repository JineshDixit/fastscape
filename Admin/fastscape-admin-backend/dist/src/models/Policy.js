"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPolicyModel = exports.Policy = void 0;
const sequelize_1 = require("sequelize");
class Policy extends sequelize_1.Model {
}
exports.Policy = Policy;
const initPolicyModel = (sequelize) => {
    Policy.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        permissions: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
            validate: {
                isArrayOfStrings(value) {
                    if (!Array.isArray(value)) {
                        throw new Error('Permissions must be an array');
                    }
                    if (!value.every((item) => typeof item === 'string')) {
                        throw new Error('All permissions must be strings');
                    }
                },
            },
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        isActive: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: true,
        },
    }, {
        sequelize,
        freezeTableName: true,
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        underscored: true,
        tableName: 'policies',
        modelName: 'Policy',
        indexes: [
            {
                fields: ['name'],
                unique: true,
            },
            {
                fields: ['is_active'],
            },
        ],
    });
};
exports.initPolicyModel = initPolicyModel;
//# sourceMappingURL=Policy.js.map