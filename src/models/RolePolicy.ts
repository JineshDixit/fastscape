import { DataTypes, Model, Sequelize } from 'sequelize';

export class RolePolicy extends Model {
  public id!: number;
  public roleId!: number;
  public policyId!: number;
  public readonly createdAt!: Date;
}

export const initRolePolicyModel = (sequelize: Sequelize) => {
  RolePolicy.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      roleId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'role_id',
        references: {
          model: 'roles',
          key: 'id',
        },
      },
      policyId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'policy_id',
        references: {
          model: 'policies',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: false,
      underscored: true,
      tableName: 'role_policies',
      modelName: 'RolePolicy',
      indexes: [
        {
          unique: true,
          fields: ['role_id', 'policy_id'],
        },
      ],
    }
  );
};