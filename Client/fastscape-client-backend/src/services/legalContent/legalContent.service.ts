import { QueryTypes } from 'sequelize';
import { LegalContent } from '../../models';
import {
  LEGAL_CONTENT_LOCALES,
  LegalContentBlock,
  LegalContentLocale,
  LegalContentTranslations,
  LocalizedLegalContent,
} from '../../models/legalContent.model';
import { createError } from '../middleware/errorHandler';

const ACTIVE_LEGAL_DOCUMENT_WHERE = {
  isActive: true,
  isDeleted: false,
};
const DEFAULT_LEGAL_CONTENT_LOCALE: LegalContentLocale = 'en';
let localizationColumnsReady = false;

export interface LegalDocumentSummary {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  version: number;
  resolvedLocale: LegalContentLocale;
  availableLocales: LegalContentLocale[];
  updatedAt: Date;
}

export interface LegalDocumentDetail extends LegalDocumentSummary {
  blocks: LegalContentBlock[];
  createdAt: Date;
}

const isSupportedLocale = (locale?: string): locale is LegalContentLocale =>
  Boolean(locale && LEGAL_CONTENT_LOCALES.includes(locale as LegalContentLocale));

const normalizeRequestedLocale = (locale?: string): LegalContentLocale =>
  isSupportedLocale(locale?.trim().toLowerCase()) ? (locale!.trim().toLowerCase() as LegalContentLocale) : DEFAULT_LEGAL_CONTENT_LOCALE;

const getAvailableLocales = (translations?: LegalContentTranslations): LegalContentLocale[] => {
  const translatedLocales = Object.keys(translations || {}).filter(isSupportedLocale);
  return Array.from(new Set([DEFAULT_LEGAL_CONTENT_LOCALE, ...translatedLocales])) as LegalContentLocale[];
};

const hasLocalizedBlocks = (translation?: LocalizedLegalContent): translation is LocalizedLegalContent & { blocks: LegalContentBlock[] } =>
  Boolean(translation?.blocks && Array.isArray(translation.blocks) && translation.blocks.length > 0);

const resolveLocalizedFields = (
  document: Pick<LegalContent, 'title' | 'description' | 'blocks' | 'translations'>,
  locale?: string,
) => {
  const requestedLocale = normalizeRequestedLocale(locale);
  const translatedContent = document.translations?.[requestedLocale];
  const localizedTitle = translatedContent?.title?.trim();
  const hasDescriptionOverride =
    Boolean(translatedContent) && Object.prototype.hasOwnProperty.call(translatedContent, 'description');
  const resolvedDescription = hasDescriptionOverride
    ? translatedContent?.description ?? null
    : document.description ?? null;

  return {
    resolvedLocale: requestedLocale,
    availableLocales: getAvailableLocales(document.translations),
    title: localizedTitle || document.title,
    description: resolvedDescription,
    blocks: hasLocalizedBlocks(translatedContent) ? translatedContent.blocks : document.blocks,
  };
};

const ensureSequelize = () => {
  const sequelizeInstance = LegalContent.sequelize;
  if (!sequelizeInstance) {
    throw createError('Database is not initialized', 500, 'LEGAL_CONTENT_DB_NOT_INITIALIZED');
  }
  return sequelizeInstance;
};

const ensureLocalizationColumns = async (): Promise<void> => {
  if (localizationColumnsReady) {
    return;
  }

  const sequelizeInstance = ensureSequelize();

  const requiredColumns = [
    { table: 'legal_content_documents', column: 'translations' },
    { table: 'legal_content_versions', column: 'translations' },
  ];

  for (const { table, column } of requiredColumns) {
    const existingColumns = await sequelizeInstance.query<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = :table AND column_name = :column`,
      {
        replacements: { table, column },
        type: QueryTypes.SELECT,
      },
    );

    if (existingColumns.length === 0) {
      await sequelizeInstance.query(
        `ALTER TABLE "${table}" ADD COLUMN "${column}" JSONB NOT NULL DEFAULT '{}'::jsonb`,
      );
    }
  }

  localizationColumnsReady = true;
};

class LegalContentService {
  async getActiveDocuments(locale?: string): Promise<LegalDocumentSummary[]> {
    await ensureLocalizationColumns();
    const documents = await LegalContent.findAll({
      where: ACTIVE_LEGAL_DOCUMENT_WHERE,
      attributes: ['id', 'slug', 'title', 'description', 'translations', 'version', 'updatedAt'],
      order: [
        ['title', 'ASC'],
        ['updatedAt', 'DESC'],
      ],
    });

    return documents
      .map((document) => {
        const normalizedDocument = document.toJSON() as LegalContent;
        const localized = resolveLocalizedFields(normalizedDocument, locale);

        return {
          id: normalizedDocument.id,
          slug: normalizedDocument.slug,
          title: localized.title,
          description: localized.description,
          version: normalizedDocument.version,
          resolvedLocale: localized.resolvedLocale,
          availableLocales: localized.availableLocales,
          updatedAt: normalizedDocument.updatedAt,
        };
      })
      .sort((left, right) => left.title.localeCompare(right.title, normalizeRequestedLocale(locale)));
  }

  async getDocumentBySlug(slug: string, locale?: string): Promise<LegalDocumentDetail> {
    await ensureLocalizationColumns();
    const normalizedSlug = slug.trim().toLowerCase();

    if (!normalizedSlug) {
      throw createError('Legal document slug is required', 400, 'LEGAL_CONTENT_SLUG_REQUIRED');
    }

    const document = await LegalContent.findOne({
      where: {
        ...ACTIVE_LEGAL_DOCUMENT_WHERE,
        slug: normalizedSlug,
      },
      attributes: ['id', 'slug', 'title', 'description', 'blocks', 'translations', 'version', 'createdAt', 'updatedAt'],
    });

    if (!document) {
      throw createError('Legal document not found', 404, 'LEGAL_CONTENT_NOT_FOUND');
    }

    const normalizedDocument = document.toJSON() as LegalContent;
    const localized = resolveLocalizedFields(normalizedDocument, locale);

    return {
      id: normalizedDocument.id,
      slug: normalizedDocument.slug,
      title: localized.title,
      description: localized.description,
      blocks: localized.blocks,
      version: normalizedDocument.version,
      resolvedLocale: localized.resolvedLocale,
      availableLocales: localized.availableLocales,
      createdAt: normalizedDocument.createdAt,
      updatedAt: normalizedDocument.updatedAt,
    };
  }
}

export const legalContentService = new LegalContentService();
