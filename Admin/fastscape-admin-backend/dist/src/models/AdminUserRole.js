"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAdminUserRoleModel = exports.AdminUserRole = void 0;
const sequelize_1 = require("sequelize");
class AdminUserRole extends sequelize_1.Model {
}
exports.AdminUserRole = AdminUserRole;
const initAdminUserRoleModel = (sequelize) => {
    AdminUserRole.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        adminUserId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            field: 'admin_user_id',
            references: {
                model: 'admin_users',
                key: 'id',
            },
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
        assignedBy: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            field: 'assigned_by',
            references: {
                model: 'admin_users',
                key: 'id',
            },
        },
    }, {
        sequelize,
        freezeTableName: true,
        timestamps: true,
        createdAt: 'assignedAt',
        updatedAt: false,
        underscored: true,
        tableName: 'admin_user_roles',
        modelName: 'AdminUserRole',
        indexes: [
            {
                unique: true,
                fields: ['admin_user_id', 'role_id'],
            },
        ],
    });
};
exports.initAdminUserRoleModel = initAdminUserRoleModel;
//# sourceMappingURL=AdminUserRole.js.map