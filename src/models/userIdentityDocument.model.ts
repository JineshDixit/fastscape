import { DataTypes, Model, Sequelize } from 'sequelize';

export class UserIdentityDocument extends Model {
  public id!: string;
  public userId!: string;
  public driverLicenseFront!: string;
  public driverLicenseBack!: string;
  public passportPhoto!: string;
  public internationalDrivingPermit!: string;
  public selfieWithLicense!: string;
  public verified!: boolean;
}

export const initUserIdentityDocumentModel = (sequelize: Sequelize) => {
  UserIdentityDocument.init(
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
      driverLicenseFront: DataTypes.TEXT,
      driverLicenseBack: DataTypes.TEXT,
      passportPhoto: DataTypes.TEXT,
      internationalDrivingPermit: DataTypes.TEXT,
      selfieWithLicense: DataTypes.TEXT,
      verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
      underscored: true,
      tableName: 'user_identity_documents',
      modelName: 'UserIdentityDocument',
    },
  );
};
