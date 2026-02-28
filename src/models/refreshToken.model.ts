import { DataTypes, Model, Sequelize } from 'sequelize';

export class RefreshToken extends Model {
  public id!: string;
  public userId!: string;
  public token!: string;
  public expiresAt!: Date;
  public isRevoked!: boolean;
  public rotatedAt?: Date;
  public createdAt!: Date;
  public updatedAt!: Date;
}

export const initRefreshTokenModel = (sequelize: Sequelize) => {
  RefreshToken.init(
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
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      isRevoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      rotatedAt: {
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
      tableName: 'refresh_tokens',
      modelName: 'RefreshToken',
    },
  );
};
