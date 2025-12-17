import { DataTypes, Model, Sequelize } from 'sequelize';
import { dbEnums } from '../common/enum/dbEnums';

export class Vehicle extends Model {
  public id!: string;
  public make!: string;
  public model!: string;
  public trim!: string;
  public year!: number;
  public exteriorColor!: string;
  public interiorColor!: string;
  public bodyType!: typeof dbEnums.VEHICLE_BODY_TYPE[number];
  public transmission!: typeof dbEnums.TRANSMISSION_TYPE[number];
  public drivetrain!: typeof dbEnums.DRIVETRAIN_TYPE[number];
  public engine!: string;
  public horsepower!: number;
  public fuelType!: typeof dbEnums.FUEL_TYPE[number];
  public fuelConsumption!: string;
  public pricePerDay!: number;
  public currency!: string;
  public isAvailable!: boolean;
}

export const initVehicleModel = (sequelize: Sequelize) => {
  Vehicle.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      make: DataTypes.STRING,
      model: DataTypes.STRING,
      trim: DataTypes.STRING,
      year: DataTypes.INTEGER,
      exteriorColor: DataTypes.STRING,
      interiorColor: DataTypes.STRING,
      bodyType: DataTypes.ENUM(...dbEnums.VEHICLE_BODY_TYPE),
      transmission: DataTypes.ENUM(...dbEnums.TRANSMISSION_TYPE),
      drivetrain: DataTypes.ENUM(...dbEnums.DRIVETRAIN_TYPE),
      engine: DataTypes.STRING,
      horsepower: DataTypes.INTEGER,
      fuelType: DataTypes.ENUM(...dbEnums.FUEL_TYPE),
      fuelConsumption: DataTypes.STRING,
      pricePerDay: DataTypes.DECIMAL(10, 2),
      currency: DataTypes.STRING,
      isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      }
    },
    {
      sequelize,
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
      underscored: true,
      tableName: 'vehicles',
      modelName: 'Vehicle',
    },
  );
};
