/*
 * MANUAL MIGRATION QUERY:
 * ALTER TABLE users ADD COLUMN reset_password_otp VARCHAR(255);
 * ALTER TABLE users ADD COLUMN reset_password_otp_expires TIMESTAMP WITH TIME ZONE;
 * -- MANUAL MIGRATION FOR ADDRESS REFACTOR:
 * -- ALTER TABLE users DROP COLUMN city;
 * -- ALTER TABLE users DROP COLUMN state;
 * -- ALTER TABLE users DROP COLUMN zip_code;
 * -- ALTER TABLE users DROP COLUMN country;
 */

import { DataTypes, Model, Sequelize } from 'sequelize';

export class User extends Model {
  public id!: string;
  public fullName!: string;
  public dateOfBirth!: Date;
  public nationality!: string;
  public email!: string;
  public phone!: string;
  public passwordHash!: string;
  public isBlocked!: boolean;
  public resetPasswordOtp!: string | null;
  public resetPasswordOtpExpires!: Date | null;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initUserModel = (sequelize: Sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      fullName: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      nationality: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(150),
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      passwordHash: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      isBlocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      resetPasswordOtp: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetPasswordOtpExpires: {
        type: DataTypes.DATE,
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
      tableName: 'users',
      modelName: 'User',
      indexes: [
        {
          fields: ['email'],
          unique: true,
        },
        {
          fields: ['phone'],
        },
        {
          fields: ['is_blocked'],
        },
      ],
    },
  );
};
