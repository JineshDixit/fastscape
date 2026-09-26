"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAdminUserModel = exports.AdminUser = void 0;
const sequelize_1 = require("sequelize");
class AdminUser extends sequelize_1.Model {
    // Virtual field for full name
    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }
}
exports.AdminUser = AdminUser;
const initAdminUserModel = (sequelize) => {
    AdminUser.init({
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
        email: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        passwordHash: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
        },
        isActive: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: true,
        },
        preferredLanguage: {
            type: sequelize_1.DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'en',
            validate: {
                isIn: [['en', 'es', 'fr', 'de', 'ar']],
            },
        },
    }, {
        sequelize,
        freezeTableName: true,
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        underscored: true,
        tableName: 'admin_users',
        modelName: 'AdminUser',
        indexes: [
            {
                fields: ['email'],
                unique: true,
            },
            {
                fields: ['is_active'],
            },
        ],
    });
};
exports.initAdminUserModel = initAdminUserModel;
//# sourceMappingURL=AdminUser.js.map