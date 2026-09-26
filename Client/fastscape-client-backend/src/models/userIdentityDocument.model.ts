import { DataTypes, Model, Sequelize } from 'sequelize';
import { dbEnums } from '../common/enum/dbEnums';

export class UserIdentityDocument extends Model {
  public id!: string;
  public userId!: string;
  public driverLicenseFront!: string;
  public driverLicenseBack!: string;
  public passportPhoto!: string;
  public internationalDrivingPermit!: string;
  public selfieWithLicense!: string;
  public verified!: boolean;
  public verificationStatus!: string;
  public verificationDate!: Date | null;
  public verificationNotes!: string | null;
  public documentExpiryDate!: Date | null;
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
      verificationStatus: {
        type: DataTypes.ENUM(...dbEnums.DOCUMENT_VERIFICATION_STATUS),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      verificationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      verificationNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      documentExpiryDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
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
