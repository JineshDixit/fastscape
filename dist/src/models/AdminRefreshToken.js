"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRefreshToken = exports.initAdminRefreshTokenModel = void 0;
const sequelize_1 = require("sequelize");
class AdminRefreshToken extends sequelize_1.Model {
}
exports.AdminRefreshToken = AdminRefreshToken;
const initAdminRefreshTokenModel = (sequelize) => {
    AdminRefreshToken.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        adminUserId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'admin_users',
                key: 'id',
            },
        },
        token: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
            unique: true,
        },
        expiresAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        isRevoked: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        deviceInfo: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        ipAddress: {
            type: sequelize_1.DataTypes.STRING(45),
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'AdminRefreshToken',
        tableName: 'admin_refresh_tokens',
        timestamps: true,
        underscored: true,
        freezeTableName: true,
        createdAt: true,
        updatedAt: true,
        indexes: [
            {
                fields: ['admin_user_id'],
            },
            {
                fields: ['token'],
                unique: true,
            },
            {
                fields: ['expires_at'],
            },
            {
                fields: ['is_revoked'],
            },
        ],
    });
};
exports.initAdminRefreshTokenModel = initAdminRefreshTokenModel;
//# sourceMappingURL=AdminRefreshToken.js.map