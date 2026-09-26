"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initVehicleMediaModel = exports.VehicleMedia = void 0;
const sequelize_1 = require("sequelize");
class VehicleMedia extends sequelize_1.Model {
}
exports.VehicleMedia = VehicleMedia;
const initVehicleMediaModel = (sequelize) => {
    VehicleMedia.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        vehicleId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'vehicles',
                key: 'id',
            },
        },
        frontImage: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            comment: 'S3 URL for front view of the vehicle',
        },
        backImage: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            comment: 'S3 URL for back view of the vehicle',
        },
        leftSideImage: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            comment: 'S3 URL for left side view of the vehicle',
        },
        rightSideImage: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            comment: 'S3 URL for right side view of the vehicle',
        },
        frontLeftImage: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            comment: 'S3 URL for front-left diagonal view of the vehicle',
        },
        frontRightImage: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            comment: 'S3 URL for front-right diagonal view of the vehicle',
        },
        interiorFrontImage: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            comment: 'S3 URL for interior front view (dashboard, seats)',
        },
        interiorBackImage: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            comment: 'S3 URL for interior back view (rear seats)',
        },
        dashboardImage: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            comment: 'S3 URL for dashboard and controls view',
        },
        engineImage: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            comment: 'S3 URL for engine bay view',
        },
        isPrimary: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Indicates if this is the primary media record for the vehicle',
        },
    }, {
        sequelize,
        freezeTableName: true,
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        underscored: true,
        tableName: 'vehicle_media',
        modelName: 'VehicleMedia',
        indexes: [
            {
                fields: ['vehicle_id'],
            },
            {
                fields: ['is_primary'],
            },
            {
                fields: ['vehicle_id', 'is_primary'],
            },
        ],
    });
};
exports.initVehicleMediaModel = initVehicleMediaModel;
//# sourceMappingURL=vehicleMedia.model.js.map