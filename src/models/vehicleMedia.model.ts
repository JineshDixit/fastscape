import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface VehicleMediaAttributes {
  id: string;
  vehicleId: string;
  frontImage?: string;
  backImage?: string;
  leftSideImage?: string;
  rightSideImage?: string;
  frontLeftImage?: string;
  frontRightImage?: string;
  interiorFrontImage?: string;
  interiorBackImage?: string;
  dashboardImage?: string;
  engineImage?: string;
  isPrimary: boolean;
}

export interface VehicleMediaCreationAttributes extends Optional<
  VehicleMediaAttributes,
  | 'id'
  | 'frontImage'
  | 'backImage'
  | 'leftSideImage'
  | 'rightSideImage'
  | 'frontLeftImage'
  | 'frontRightImage'
  | 'interiorFrontImage'
  | 'interiorBackImage'
  | 'dashboardImage'
  | 'engineImage'
  | 'isPrimary'
> {}

export class VehicleMedia
  extends Model<VehicleMediaAttributes, VehicleMediaCreationAttributes>
  implements VehicleMediaAttributes
{
  public id!: string;
  public vehicleId!: string;
  public frontImage!: string;
  public backImage!: string;
  public leftSideImage!: string;
  public rightSideImage!: string;
  public frontLeftImage!: string;
  public frontRightImage!: string;
  public interiorFrontImage!: string;
  public interiorBackImage!: string;
  public dashboardImage!: string;
  public engineImage!: string;
  public isPrimary!: boolean;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initVehicleMediaModel = (sequelize: Sequelize) => {
  VehicleMedia.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      vehicleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'vehicles',
          key: 'id',
        },
      },
      frontImage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'S3 URL for front view of the vehicle',
      },
      backImage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'S3 URL for back view of the vehicle',
      },
      leftSideImage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'S3 URL for left side view of the vehicle',
      },
      rightSideImage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'S3 URL for right side view of the vehicle',
      },
      frontLeftImage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'S3 URL for front-left diagonal view of the vehicle',
      },
      frontRightImage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'S3 URL for front-right diagonal view of the vehicle',
      },
      interiorFrontImage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'S3 URL for interior front view (dashboard, seats)',
      },
      interiorBackImage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'S3 URL for interior back view (rear seats)',
      },
      dashboardImage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'S3 URL for dashboard and controls view',
      },
      engineImage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'S3 URL for engine bay view',
      },
      isPrimary: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indicates if this is the primary media record for the vehicle',
      },
    },
    {
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
    },
  );
};
