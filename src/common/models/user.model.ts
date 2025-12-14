import { DataTypes, Model, Sequelize } from 'sequelize';

export class User extends Model {
  public id!: number;
  public fullName!: string;
  public dateOfBirth!: Date;
  public nationality!: string;
  public email!: string;
  public phone!: number;
  public passwordHash!: string;
  public homeAddress!: string;
  public isBlocked!: boolean;
}

export const initUserModel = (sequelize: Sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUID,
        primaryKey: true,
      },
      fullName: DataTypes.STRING(150),
      dateOfBirth: DataTypes.DATEONLY,
      nationality: DataTypes.STRING(100),
      email: {
        type: DataTypes.STRING(150),
        unique: true,
      },
      phone: DataTypes.STRING(20),
      passwordHash: DataTypes.TEXT,
      homeAddress: DataTypes.TEXT,
      isBlocked: {
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
      tableName: 'users',
      modelName: 'users',
    },
  );
};
