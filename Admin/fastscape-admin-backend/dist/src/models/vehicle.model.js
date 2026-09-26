"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initVehicleModel = exports.Vehicle = void 0;
const sequelize_1 = require("sequelize");
const dbEnums_1 = require("../common/enum/dbEnums");
class Vehicle extends sequelize_1.Model {
}
exports.Vehicle = Vehicle;
const initVehicleModel = (sequelize) => {
    Vehicle.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        make: sequelize_1.DataTypes.STRING,
        model: sequelize_1.DataTypes.STRING,
        trim: sequelize_1.DataTypes.STRING,
        year: sequelize_1.DataTypes.INTEGER,
        exteriorColor: sequelize_1.DataTypes.STRING,
        interiorColor: sequelize_1.DataTypes.STRING,
        bodyType: sequelize_1.DataTypes.ENUM(...dbEnums_1.dbEnums.VEHICLE_BODY_TYPE),
        transmission: sequelize_1.DataTypes.ENUM(...dbEnums_1.dbEnums.TRANSMISSION_TYPE),
        drivetrain: sequelize_1.DataTypes.ENUM(...dbEnums_1.dbEnums.DRIVETRAIN_TYPE),
        engine: sequelize_1.DataTypes.STRING,
        horsepower: sequelize_1.DataTypes.INTEGER,
        fuelType: sequelize_1.DataTypes.ENUM(...dbEnums_1.dbEnums.FUEL_TYPE),
        fuelConsumption: sequelize_1.DataTypes.STRING,
        pricePerDay: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        delayChargePerHour: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            comment: 'Hourly charge for late return',
        },
        depositPercentage: {
            type: sequelize_1.DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 20.0,
            comment: 'Default deposit percentage for this vehicle',
        },
        currency: {
            type: sequelize_1.DataTypes.STRING(3),
            allowNull: false,
            defaultValue: 'USD',
        },
        isAvailable: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: true,
        },
        passengerCapacity: {
            type: sequelize_1.DataTypes.INTEGER,
            defaultValue: 5,
            allowNull: false,
        },
        locationId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'locations',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment: 'Reference to location table',
        },
    }, {
        sequelize,
        freezeTableName: true,
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        underscored: true,
        tableName: 'vehicles',
        modelName: 'Vehicle',
    });
};
exports.initVehicleModel = initVehicleModel;
//# sourceMappingURL=vehicle.model.js.map