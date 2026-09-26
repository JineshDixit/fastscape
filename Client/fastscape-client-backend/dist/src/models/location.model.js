"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initLocationModel = exports.Location = void 0;
const sequelize_1 = require("sequelize");
class Location extends sequelize_1.Model {
}
exports.Location = Location;
const initLocationModel = (sequelize) => {
    Location.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        city: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        code: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        isActive: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: true,
        },
    }, {
        sequelize,
        tableName: 'locations',
        timestamps: true,
    });
};
exports.initLocationModel = initLocationModel;
//# sourceMappingURL=location.model.js.map