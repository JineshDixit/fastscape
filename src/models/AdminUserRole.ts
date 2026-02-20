import { DataTypes, Model, Sequelize } from 'sequelize';

export class AdminUserRole extends Model {
  public id!: string;
  public adminUserId!: string;
  public roleId!: string;
  public readonly assignedAt!: Date;
  public assignedBy?: number;
}

export const initAdminUserRoleModel = (sequelize: Sequelize) => {
  AdminUserRole.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      adminUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'admin_users',
          key: 'id',
        },
      },
      roleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
      },
      assignedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'admin_users',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      freezeTableName: true,
      timestamps: true,
      createdAt: 'assignedAt',
      updatedAt: false,
      underscored: true,
      tableName: 'admin_user_roles',
      modelName: 'AdminUserRole',
      indexes: [
        {
          unique: true,
          fields: ['admin_user_id', 'role_id'],
        },
      ],
    },
  );
};
