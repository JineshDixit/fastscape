import { DataTypes, Model, Sequelize } from 'sequelize';

export class Address extends Model {
  public id!: string;
  public userId!: string;
  public type!: string;
  public addressLine1!: string;
  public addressLine2!: string | null;
  public city!: string;
  public state!: string;
  public zipCode!: string;
  public country!: string;
  public isDefault!: boolean;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initAddressModel = (sequelize: Sequelize) => {
  Address.init(
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
        onDelete: 'CASCADE',
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'Home', // e.g., Home, Work, Other
      },
      addressLine1: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      addressLine2: {
        type: DataTypes.STRING(255),
        allowNull: true,
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
      isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      freezeTableName: true,
      timestamps: true,
      underscored: true,
      tableName: 'addresses',
      modelName: 'Address',
    },
  );
};
