"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRoleModel = exports.Role = void 0;
const sequelize_1 = require("sequelize");
class Role extends sequelize_1.Model {
}
exports.Role = Role;
const initRoleModel = (sequelize) => {
    Role.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        isActive: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active',
        },
    }, {
        sequelize,
        freezeTableName: true,
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        underscored: true,
        tableName: 'roles',
        modelName: 'Role',
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
exports.initRoleModel = initRoleModel;
//# sourceMappingURL=Role.js.map