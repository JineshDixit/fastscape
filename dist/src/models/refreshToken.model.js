"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRefreshTokenModel = exports.RefreshToken = void 0;
const sequelize_1 = require("sequelize");
class RefreshToken extends sequelize_1.Model {
}
exports.RefreshToken = RefreshToken;
const initRefreshTokenModel = (sequelize) => {
    RefreshToken.init({
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
        rotatedAt: {
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
        tableName: 'refresh_tokens',
        modelName: 'RefreshToken',
    });
};
exports.initRefreshTokenModel = initRefreshTokenModel;
//# sourceMappingURL=refreshToken.model.js.map