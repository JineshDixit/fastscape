/*
 * ALTER TABLE users ADD COLUMN reset_password_otp VARCHAR(255);
 * ALTER TABLE users ADD COLUMN reset_password_otp_expires TIMESTAMP WITH TIME ZONE;
 * ALTER TABLE users ADD COLUMN verification_status VARCHAR(50) DEFAULT 'PENDING';
 */

import { DataTypes, Model, Sequelize } from 'sequelize';

export class User extends Model {
  public id!: string;
  public firstName!: string;
  public lastName!: string;
  public dateOfBirth!: Date;
  public nationality!: string;
  public email!: string;
  public phone!: string;
  public passwordHash!: string;
  public city!: string;
  public state!: string;
  public zipCode!: string;
  public country!: string;
  public isBlocked!: boolean;
  public resetPasswordOtp!: string | null;
  public resetPasswordOtpExpires!: Date | null;
  public verificationStatus!: 'PENDING' | 'VERIFIED' | 'REJECTED';
  public verificationDate!: Date | null;
}

export const initUserModel = (sequelize: Sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
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
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      zipCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: true,
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
      verificationStatus: {
        type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
        defaultValue: 'PENDING',
      },
      verificationDate: {
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
          fields: ['city', 'state'],
        },
        {
          fields: ['country'],
        },
        {
          fields: ['is_blocked'],
        },
      ],
    },
  );
};
