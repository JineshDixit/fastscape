import { DataTypes, Model, Sequelize } from 'sequelize';
import { LegalContentBlock, LegalContentTranslations } from './legalContent.model';

export class LegalContentVersion extends Model {
  public id!: string;
  public legalContentId!: string;
  public version!: number;
  public title!: string;
  public description?: string | null;
  public blocks!: LegalContentBlock[];
  public translations!: LegalContentTranslations;
  public changeNote?: string | null;
  public createdBy?: string | null;
  public readonly createdAt!: Date;
}

export const initLegalContentVersionModel = (sequelize: Sequelize) => {
  LegalContentVersion.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      legalContentId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'legal_content_id',
        references: {
          model: 'legal_content_documents',
          key: 'id',
        },
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      blocks: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      translations: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      changeNote: {
        type: DataTypes.STRING(300),
        allowNull: true,
        field: 'change_note',
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'created_by',
      },
    },
    {
      sequelize,
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: false,
      underscored: true,
      tableName: 'legal_content_versions',
      modelName: 'LegalContentVersion',
      indexes: [
        {
          fields: ['legal_content_id', 'version'],
          unique: true,
        },
      ],
    },
  );
};
