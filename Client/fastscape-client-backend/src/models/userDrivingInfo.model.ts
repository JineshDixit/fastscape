import { DataTypes, Model, Sequelize } from 'sequelize';
import { dbEnums } from '../common/enum/dbEnums';

export class UserDrivingInfo extends Model {
  public id!: string;
  public userId!: string;
  public licenseIssuingCountry!: string;
  public licenseExpiryDate!: Date;
  public drivingExperienceYears!: string;
  public visaStatus!: (typeof dbEnums.VISA_STATUS)[number];
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
        references: {
          model: 'users',
          key: 'id',
        },
      },
      licenseIssuingCountry: DataTypes.STRING(100),
      licenseExpiryDate: DataTypes.DATEONLY,
      drivingExperienceYears: DataTypes.INTEGER,
      visaStatus: DataTypes.ENUM(...dbEnums.VISA_STATUS),
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
    },
  );
};
