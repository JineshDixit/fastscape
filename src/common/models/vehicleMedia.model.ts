import { DataTypes, Model, Sequelize } from 'sequelize';

export class VehicleMedia extends Model {
  public id!: string;
  public vehicalId!: string
  public mediaType!: string;
  public mediaUrl!: string;
}

export const initVehicleMediaModel = (sequelize: Sequelize) => {
  VehicleMedia.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      vehicalId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'vehicles',
          key: 'id',
        }
      },
      mediaType: DataTypes.STRING(30),
      mediaUrl: DataTypes.TEXT,
    },
    {
      sequelize,
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
      underscored: true,
      tableName: 'vehicle_media',
      modelName: 'VehicleMedia',
    },
  );
};
