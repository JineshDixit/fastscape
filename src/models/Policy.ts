import { DataTypes, Model, Sequelize } from 'sequelize';

export class Policy extends Model {
  public id!: string;
  public name!: string;
  public permissions!: string[];
  public description?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initPolicyModel = (sequelize: Sequelize) => {
  Policy.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      permissions: {
        type: DataTypes.JSONB,
        allowNull: false,
        validate: {
          isArrayOfStrings(value: any) {
            if (!Array.isArray(value)) {
              throw new Error('Permissions must be an array');
            }
            if (!value.every((item) => typeof item === 'string')) {
              throw new Error('All permissions must be strings');
            }
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      tableName: 'policies',
      modelName: 'Policy',
      indexes: [
        {
          fields: ['name'],
          unique: true,
        },
        {
          fields: ['is_active'],
        },
      ],
    },
  );
};
