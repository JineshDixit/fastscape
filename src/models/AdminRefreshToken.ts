import { DataTypes, Model, Sequelize } from 'sequelize';
import { AdminRefreshTokenCreationAttributes, AdminRefreshTokenAttributes } from '../common/interfaces/modelInterfaces';

class AdminRefreshToken extends Model<AdminRefreshTokenAttributes, AdminRefreshTokenCreationAttributes> implements AdminRefreshTokenAttributes {
  public id!: string;
  public adminUserId!: string;
  public token!: string;
  public expiresAt!: Date;
  public isRevoked!: boolean;
  public deviceInfo?: string;
  public ipAddress?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

const initAdminRefreshTokenModel = (sequelize: Sequelize): void => {
  AdminRefreshToken.init(
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
      token: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      isRevoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      deviceInfo: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'AdminRefreshToken',
      tableName: 'admin_refresh_tokens',
      timestamps: true,
      underscored: true,
      freezeTableName: true,
      createdAt: true,
      updatedAt: true,
      indexes: [
        {
          fields: ['admin_user_id'],
        },
        {
          fields: ['token'],
          unique: true,
        },
        {
          fields: ['expires_at'],
        },
        {
          fields: ['is_revoked'],
        },
      ],
    }
  );
};

export { initAdminRefreshTokenModel, AdminRefreshToken };