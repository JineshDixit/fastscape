import { DataTypes, Model, Sequelize } from 'sequelize';

export class AdminUser extends Model {
  public id!: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public passwordHash!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual field for full name
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

export const initAdminUserModel = (sequelize: Sequelize) => {
  AdminUser.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING(50),
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
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
      underscored: true,
      tableName: 'admin_users',
      modelName: 'AdminUser',
      indexes: [
        {
          fields: ['email'],
          unique: true,
        },
        {
          fields: ['is_active'],
        },
      ],
    }
  );
};