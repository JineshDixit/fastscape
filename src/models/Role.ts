import { DataTypes, Model, Sequelize } from 'sequelize';

export class Role extends Model {
  public id!: string;
  public name!: string;
  public description?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initRoleModel = (sequelize: Sequelize) => {
  Role.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      sequelize,
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
      underscored: true,
      tableName: 'roles',
      modelName: 'Role',
      indexes: [
        {
          fields: ['name'],
          unique: true,
        },
        {
          fields: ['is_active'],
        },
      ],
    }
  );
};