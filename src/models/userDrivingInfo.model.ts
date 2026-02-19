import { DataTypes, Model, Sequelize } from 'sequelize';
import { dbEnums } from '../common/enum/dbEnums';

export class UserDrivingInfo extends Model {
  public id!: string;
  public userId!: string;
  public licenseIssuingCountry!: string;
  public licenseExpiryDate!: Date;
  public drivingExperienceYears!: number; // Fixed: should be number, not string
  public visaStatus!: (typeof dbEnums.VISA_STATUS)[number];
  public isVerified!: boolean;
  public verificationDate!: Date | null;
  public version!: number;
}

export const initUserDrivingInfoModel = (sequelize: Sequelize) => {
  UserDrivingInfo.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true, // One driving info per user
        references: {
          model: 'users',
          key: 'id',
        },
      },
      licenseIssuingCountry: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      licenseExpiryDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: true,
          isAfter: new Date().toISOString().split('T')[0], // Must be in the future
        },
      },
      drivingExperienceYears: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 80, // Reasonable maximum
        },
      },
      visaStatus: {
        type: DataTypes.ENUM(...dbEnums.VISA_STATUS),
        allowNull: false,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      verificationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Version field for optimistic locking',
      },
    },
    {
      sequelize,
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
      underscored: true,
      tableName: 'user_driving_info',
      modelName: 'UserDrivingInfo',
      validate: {
        // Custom validation to ensure license is not expired
        licenseNotExpired() {
          if (this.licenseExpiryDate && new Date(this.licenseExpiryDate) <= new Date()) {
            throw new Error('License expiry date must be in the future');
          }
        },
      },
    },
  );
};
