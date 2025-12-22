import { DataTypes, Model, Sequelize } from 'sequelize';
import { dbEnums } from '../common/enum/dbEnums';

export class Chauffeur extends Model {
  public id!: string;
  public fullName!: string;
  public email!: string;
  public phone!: string;
  public dateOfBirth!: Date;
  public nationality!: string;
  public profilePhoto!: string;
  public licenseNumber!: string;
  public licenseExpiryDate!: Date;
  public licenseIssuingCountry!: string;
  public experienceLevel!: (typeof dbEnums.CHAUFFEUR_EXPERIENCE)[number];
  public yearsOfExperience!: number;
  public languages!: string[];
  public specializations!: string[];
  public hourlyRate!: number;
  public currency!: string;
  public status!: (typeof dbEnums.CHAUFFEUR_STATUS)[number];
  public rating!: number;
  public totalTrips!: number;
  public isVerified!: boolean;
  public emergencyContactName!: string;
  public emergencyContactPhone!: string;
  public address!: string;
  public city!: string;
  public state!: string;
  public zipCode!: string;
  public country!: string;
  public notes!: string;
  public joinedAt!: Date;
  public lastActiveAt!: Date;
}

export const initChauffeurModel = (sequelize: Sequelize) => {
  Chauffeur.init(
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
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      dateOfBirth: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      nationality: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      profilePhoto: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      licenseNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      licenseExpiryDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      licenseIssuingCountry: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      experienceLevel: {
        type: DataTypes.ENUM(...dbEnums.CHAUFFEUR_EXPERIENCE),
        allowNull: false,
        defaultValue: 'BEGINNER',
      },
      yearsOfExperience: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 50,
        },
      },
      languages: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: ['English'],
      },
      specializations: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: ['Sedan', 'SUV'],
        comment: 'Vehicle types the chauffeur can drive',
      },
      hourlyRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 25.00,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      status: {
        type: DataTypes.ENUM(...dbEnums.CHAUFFEUR_STATUS),
        allowNull: false,
        defaultValue: 'AVAILABLE',
      },
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 5.00,
        validate: {
          min: 0,
          max: 5,
        },
      },
      totalTrips: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      emergencyContactName: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      emergencyContactPhone: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      zipCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      lastActiveAt: {
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
      tableName: 'chauffeurs',
      modelName: 'Chauffeur',
      indexes: [
        {
          fields: ['email'],
          unique: true,
        },
        {
          fields: ['phone'],
          unique: true,
        },
        {
          fields: ['license_number'],
          unique: true,
        },
        {
          fields: ['status'],
        },
        {
          fields: ['is_verified'],
        },
        {
          fields: ['rating'],
        },
        {
          fields: ['experience_level'],
        },
        {
          fields: ['hourly_rate'],
        },
        {
          fields: ['city', 'state'],
        },
      ],
    },
  );
};