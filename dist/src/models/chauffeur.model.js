"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initChauffeurModel = exports.Chauffeur = void 0;
const sequelize_1 = require("sequelize");
const dbEnums_1 = require("../common/enum/dbEnums");
class Chauffeur extends sequelize_1.Model {
}
exports.Chauffeur = Chauffeur;
const initChauffeurModel = (sequelize) => {
    Chauffeur.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        fullName: {
            type: sequelize_1.DataTypes.STRING(150),
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
        phone: {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: false,
            unique: true,
        },
        dateOfBirth: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        nationality: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
        },
        profilePhoto: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        licenseNumber: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        licenseExpiryDate: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        licenseIssuingCountry: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
        },
        experienceLevel: {
            type: sequelize_1.DataTypes.ENUM(...dbEnums_1.dbEnums.CHAUFFEUR_EXPERIENCE),
            allowNull: false,
            defaultValue: 'BEGINNER',
        },
        yearsOfExperience: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
                max: 50,
            },
        },
        languages: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
            defaultValue: ['English'],
        },
        specializations: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
            defaultValue: ['Sedan', 'SUV'],
            comment: 'Vehicle types the chauffeur can drive',
        },
        hourlyRate: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 25.0,
        },
        currency: {
            type: sequelize_1.DataTypes.STRING(3),
            allowNull: false,
            defaultValue: 'USD',
        },
        status: {
            type: sequelize_1.DataTypes.ENUM(...dbEnums_1.dbEnums.CHAUFFEUR_STATUS),
            allowNull: false,
            defaultValue: 'AVAILABLE',
        },
        rating: {
            type: sequelize_1.DataTypes.DECIMAL(3, 2),
            allowNull: false,
            defaultValue: 5.0,
            validate: {
                min: 0,
                max: 5,
            },
        },
        totalTrips: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        isVerified: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        emergencyContactName: {
            type: sequelize_1.DataTypes.STRING(150),
            allowNull: false,
        },
        emergencyContactPhone: {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: false,
        },
        address: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
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
        notes: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        joinedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        lastActiveAt: {
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
        tableName: 'chauffeurs',
        modelName: 'Chauffeur',
        indexes: [
            {
                fields: ['email'],
                unique: true,
            },
            {
                fields: ['phone'],
                unique: true,
            },
            {
                fields: ['license_number'],
                unique: true,
            },
            {
                fields: ['status'],
            },
            {
                fields: ['is_verified'],
            },
            {
                fields: ['rating'],
            },
            {
                fields: ['experience_level'],
            },
            {
                fields: ['hourly_rate'],
            },
            {
                fields: ['city', 'state'],
            },
        ],
    });
};
exports.initChauffeurModel = initChauffeurModel;
//# sourceMappingURL=chauffeur.model.js.map