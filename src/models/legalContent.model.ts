import { DataTypes, Model, Sequelize } from 'sequelize';

export const LEGAL_BLOCK_KINDS = ['heading', 'paragraph', 'bullet_list', 'numbered_list', 'quote'] as const;
export type LegalBlockKind = (typeof LEGAL_BLOCK_KINDS)[number];
export const LEGAL_CONTENT_LOCALES = ['en', 'ar'] as const;
export type LegalContentLocale = (typeof LEGAL_CONTENT_LOCALES)[number];

export interface LegalContentBlock {
  id: string;
  kind: LegalBlockKind;
  text?: string;
  items?: string[];
}

export interface LocalizedLegalContent {
  title?: string;
  description?: string | null;
  blocks?: LegalContentBlock[];
}

export type LegalContentTranslations = Partial<Record<LegalContentLocale, LocalizedLegalContent>>;

export class LegalContent extends Model {
  public id!: string;
  public slug!: string;
  public title!: string;
  public description?: string | null;
  public blocks!: LegalContentBlock[];
  public translations!: LegalContentTranslations;
  public isActive!: boolean;
  public isDeleted!: boolean;
  public version!: number;
  public createdBy?: string | null;
  public updatedBy?: string | null;
  public deletedBy?: string | null;
  public deletedAt?: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initLegalContentModel = (sequelize: Sequelize) => {
  LegalContent.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          is: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        },
      },
      title: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      blocks: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        validate: {
          isValidBlocks(value: unknown) {
            if (!Array.isArray(value)) {
              throw new Error('Blocks must be an array');
            }
          },
        },
      },
      translations: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        validate: {
          isValidTranslations(value: unknown) {
            if (!value || typeof value !== 'object' || Array.isArray(value)) {
              throw new Error('Translations must be an object');
            }
          },
        },
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_deleted',
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'created_by',
      },
      updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'updated_by',
      },
      deletedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'deleted_by',
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at',
      },
    },
    {
      sequelize,
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
      underscored: true,
      tableName: 'legal_content_documents',
      modelName: 'LegalContent',
      indexes: [
        {
          unique: true,
          fields: ['slug'],
        },
        {
          fields: ['is_deleted'],
        },
        {
          fields: ['is_active'],
        },
      ],
    },
  );
};
