import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { dbEnums } from '../common/enum/dbEnums';

export interface VehicleAttributes {
  id: string;
  make: string;
  model: string;
  trim: string;
  year: number;
  exteriorColor: string;
  interiorColor: string;
  bodyType: (typeof dbEnums.VEHICLE_BODY_TYPE)[number];
  transmission: (typeof dbEnums.TRANSMISSION_TYPE)[number];
  drivetrain: (typeof dbEnums.DRIVETRAIN_TYPE)[number];
  engine: string;
  horsepower: number;
  fuelType: (typeof dbEnums.FUEL_TYPE)[number];
  fuelConsumption: string;
  pricePerDay: number;
  delayChargePerHour: number;
  depositPercentage: number;
  currency: string;
  isAvailable: boolean;
  passengerCapacity: number;
  locationId: string;
}

export interface VehicleCreationAttributes extends Optional<
  VehicleAttributes,
  | 'id'
  | 'trim'
  | 'delayChargePerHour'
  | 'depositPercentage'
  | 'currency'
  | 'isAvailable'
  | 'passengerCapacity'
  | 'locationId'
>{}

export class Vehicle extends Model<VehicleAttributes, VehicleCreationAttributes> implements VehicleAttributes {
  public id!: string;
  public make!: string;
  public model!: string;
  public trim!: string;
  public year!: number;
  public exteriorColor!: string;
  public interiorColor!: string;
  public bodyType!: (typeof dbEnums.VEHICLE_BODY_TYPE)[number];
  public transmission!: (typeof dbEnums.TRANSMISSION_TYPE)[number];
  public drivetrain!: (typeof dbEnums.DRIVETRAIN_TYPE)[number];
  public engine!: string;
  public horsepower!: number;
  public fuelType!: (typeof dbEnums.FUEL_TYPE)[number];
  public fuelConsumption!: string;
  public pricePerDay!: number;
  public delayChargePerHour!: number;
  public depositPercentage!: number;
  public currency!: string;
  public isAvailable!: boolean;
  public passengerCapacity!: number;
  public locationId!: string;
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
      pricePerDay: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      delayChargePerHour: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Hourly charge for late return',
      },
      depositPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 20.0,
        comment: 'Default deposit percentage for this vehicle',
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      passengerCapacity: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
        allowNull: false,
      },
      locationId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'locations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Reference to location table',
      },
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
