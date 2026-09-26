"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRolePolicyModel = exports.RolePolicy = void 0;
const sequelize_1 = require("sequelize");
class RolePolicy extends sequelize_1.Model {
}
exports.RolePolicy = RolePolicy;
const initRolePolicyModel = (sequelize) => {
    RolePolicy.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        roleId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            field: 'role_id',
            references: {
                model: 'roles',
                key: 'id',
            },
        },
        policyId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            field: 'policy_id',
            references: {
                model: 'policies',
                key: 'id',
            },
        },
    }, {
        sequelize,
        freezeTableName: true,
        timestamps: true,
        createdAt: true,
        updatedAt: false,
        underscored: true,
        tableName: 'role_policies',
        modelName: 'RolePolicy',
        indexes: [
            {
                unique: true,
                fields: ['role_id', 'policy_id'],
            },
        ],
    });
};
exports.initRolePolicyModel = initRolePolicyModel;
//# sourceMappingURL=RolePolicy.js.map