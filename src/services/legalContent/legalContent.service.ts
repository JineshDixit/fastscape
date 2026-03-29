import { QueryTypes, Transaction } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { LegalContent, LegalContentVersion } from '../../models';
import {
  CreateLegalContentRequest,
  LegalContentBlock,
  LegalContentLocale,
  LegalContentResponse,
  LegalContentTranslations,
  LegalContentVersionResponse,
  LocalizedLegalContent,
  UpdateLegalContentRequest,
} from '../../common/interfaces/authTypes';
import { LEGAL_CONTENT_LOCALES } from '../../models/legalContent.model';
import { createError } from '../middleware/errorHandler';

export const SYSTEM_LEGAL_SLUGS = ['privacy-policy', 'refund-cancellation-policy', 'terms-conditions'] as const;
const DEFAULT_LEGAL_CONTENT_LOCALE: LegalContentLocale = 'en';
let localizationColumnsReady = false;

const VALID_BLOCK_KINDS = new Set(['heading', 'paragraph', 'bullet_list', 'numbered_list', 'quote']);

const MAX_TITLE_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_CHANGE_NOTE_LENGTH = 300;
const MAX_SLUG_LENGTH = 100;
const MAX_BLOCK_COUNT = 400;
const MAX_BLOCK_TEXT_LENGTH = 8000;
const MAX_BLOCK_LIST_ITEMS = 250;
const MAX_BLOCK_LIST_ITEM_LENGTH = 1000;

type LegalContentWithVersions = LegalContent & {
  versions?: LegalContentVersion[];
};

interface LegacyLegalContentRow {
  id: string;
  type: string | null;
  title: string;
  content: string;
  is_active: boolean;
  updated_by?: string | null;
}

const DEFAULT_SYSTEM_DOCUMENTS: Array<{
  slug: string;
  title: string;
  description: string;
  body: string[];
}> = [
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    description: 'Policy explaining how data is collected, processed, and protected.',
    body: [
      'This Privacy Policy describes how Fastscape collects and processes personal information.',
      'We use data for service delivery, support, security monitoring, and legal compliance.',
      'Users can contact support for privacy-related requests and clarifications.',
    ],
  },
  {
    slug: 'refund-cancellation-policy',
    title: 'Refund & Cancellation Policy',
    description: 'Policy outlining cancellation windows and refund eligibility.',
    body: [
      'Cancellations may be subject to timing-based charges depending on booking stage.',
      'Refund eligibility depends on booking status, paid amount, and applicable policy terms.',
      'Refund processing time may vary by payment provider and banking timelines.',
    ],
  },
  {
    slug: 'terms-conditions',
    title: 'Terms & Conditions',
    description: 'Terms governing access and use of Fastscape services.',
    body: [
      'By using Fastscape services, users accept these Terms & Conditions.',
      'Users must provide accurate information and comply with local regulations.',
      'Fastscape may revise service terms, pricing, and availability with periodic updates.',
    ],
  },
];

const buildDefaultBlocks = (lines: string[]): LegalContentBlock[] =>
  lines.map((line) => ({
    id: uuidv4(),
    kind: 'paragraph',
    text: line,
  }));

const isSupportedLocale = (locale: string): locale is LegalContentLocale =>
  LEGAL_CONTENT_LOCALES.includes(locale as LegalContentLocale);

const createEmptyParagraphBlock = (): LegalContentBlock => ({
  id: uuidv4(),
  kind: 'paragraph',
  text: '',
});

const formatLegalContent = (document: LegalContent): LegalContentResponse => ({
  id: document.id,
  slug: document.slug,
  title: document.title,
  description: document.description ?? null,
  blocks: document.blocks || [],
  translations: document.translations || {},
  version: document.version,
  isActive: document.isActive,
  isDeleted: document.isDeleted,
  createdBy: document.createdBy ?? null,
  updatedBy: document.updatedBy ?? null,
  deletedBy: document.deletedBy ?? null,
  deletedAt: document.deletedAt ?? null,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

const formatLegalContentVersion = (version: LegalContentVersion): LegalContentVersionResponse => ({
  id: version.id,
  legalContentId: version.legalContentId,
  version: version.version,
  title: version.title,
  description: version.description ?? null,
  blocks: version.blocks || [],
  translations: version.translations || {},
  changeNote: version.changeNote ?? null,
  createdBy: version.createdBy ?? null,
  createdAt: version.createdAt,
});

const normalizeSlug = (slug: string): string => {
  if (typeof slug !== 'string') {
    throw createError('Slug must be a string', 400);
  }

  const normalized = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!normalized) {
    throw createError('Slug is required', 400);
  }
  if (normalized.length > MAX_SLUG_LENGTH) {
    throw createError(`Slug cannot exceed ${MAX_SLUG_LENGTH} characters`, 400);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    throw createError('Slug format is invalid', 400);
  }

  return normalized;
};

const normalizeTitle = (title: string): string => {
  if (typeof title !== 'string') {
    throw createError('Title must be a string', 400);
  }

  const normalized = title.trim();
  if (!normalized) {
    throw createError('Title is required', 400);
  }
  if (normalized.length > MAX_TITLE_LENGTH) {
    throw createError(`Title cannot exceed ${MAX_TITLE_LENGTH} characters`, 400);
  }

  return normalized;
};

const normalizeDescription = (description?: string): string | null => {
  if (description === undefined) {
    return null;
  }
  if (typeof description !== 'string') {
    throw createError('Description must be a string', 400);
  }

  const normalized = description.trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length > MAX_DESCRIPTION_LENGTH) {
    throw createError(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`, 400);
  }

  return normalized;
};

const normalizeLocalizedTitle = (title: unknown): string | undefined => {
  if (title === undefined) {
    return undefined;
  }
  if (typeof title !== 'string') {
    throw createError('Localized title must be a string', 400);
  }

  const normalized = title.trim();
  if (!normalized) {
    return undefined;
  }
  if (normalized.length > MAX_TITLE_LENGTH) {
    throw createError(`Localized title cannot exceed ${MAX_TITLE_LENGTH} characters`, 400);
  }

  return normalized;
};

const normalizeLocalizedDescription = (description: unknown): string | null | undefined => {
  if (description === undefined) {
    return undefined;
  }
  if (description === null) {
    return null;
  }
  if (typeof description !== 'string') {
    throw createError('Localized description must be a string', 400);
  }

  const normalized = description.trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length > MAX_DESCRIPTION_LENGTH) {
    throw createError(`Localized description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`, 400);
  }

  return normalized;
};

const normalizeChangeNote = (changeNote?: string): string | null => {
  if (changeNote === undefined) {
    return null;
  }

  if (typeof changeNote !== 'string') {
    throw createError('Change note must be a string', 400);
  }

  const normalized = changeNote.trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length > MAX_CHANGE_NOTE_LENGTH) {
    throw createError(`Change note cannot exceed ${MAX_CHANGE_NOTE_LENGTH} characters`, 400);
  }

  return normalized;
};

const normalizeBlocks = (blocks?: LegalContentBlock[]): LegalContentBlock[] => {
  if (!blocks) {
    return [];
  }
  if (!Array.isArray(blocks)) {
    throw createError('Blocks must be an array', 400);
  }
  if (blocks.length > MAX_BLOCK_COUNT) {
    throw createError(`Blocks cannot exceed ${MAX_BLOCK_COUNT}`, 400);
  }

  return blocks.map((block, index) => {
    if (!block || typeof block !== 'object') {
      throw createError(`Block at index ${index} is invalid`, 400);
    }

    const kind = block.kind;
    if (typeof kind !== 'string' || !VALID_BLOCK_KINDS.has(kind)) {
      throw createError(`Block kind is invalid at index ${index}`, 400);
    }

    const normalized: LegalContentBlock = {
      id: typeof block.id === 'string' && block.id.trim() ? block.id.trim() : uuidv4(),
      kind: kind as LegalContentBlock['kind'],
    };

    const textKinds = new Set(['heading', 'paragraph', 'quote']);
    const listKinds = new Set(['bullet_list', 'numbered_list']);

    if (textKinds.has(kind)) {
      const text = typeof block.text === 'string' ? block.text.trim() : '';
      if (!text) {
        throw createError(`Block text is required at index ${index}`, 400);
      }
      if (text.length > MAX_BLOCK_TEXT_LENGTH) {
        throw createError(`Block text is too long at index ${index}`, 400);
      }
      normalized.text = text;
    }

    if (listKinds.has(kind)) {
      if (!Array.isArray(block.items) || block.items.length === 0) {
        throw createError(`List items are required at index ${index}`, 400);
      }
      if (block.items.length > MAX_BLOCK_LIST_ITEMS) {
        throw createError(`Too many list items at index ${index}`, 400);
      }
      normalized.items = block.items.map((item, itemIndex) => {
        if (typeof item !== 'string') {
          throw createError(`List item is invalid at block ${index}, item ${itemIndex}`, 400);
        }
        const cleanedItem = item.trim();
        if (!cleanedItem) {
          throw createError(`List item cannot be empty at block ${index}, item ${itemIndex}`, 400);
        }
        if (cleanedItem.length > MAX_BLOCK_LIST_ITEM_LENGTH) {
          throw createError(`List item is too long at block ${index}, item ${itemIndex}`, 400);
        }
        return cleanedItem;
      });
    }

    return normalized;
  });
};

const normalizeTranslations = (translations?: LegalContentTranslations): LegalContentTranslations => {
  if (translations === undefined) {
    return {};
  }
  if (!translations || typeof translations !== 'object' || Array.isArray(translations)) {
    throw createError('Translations must be an object', 400);
  }

  const normalizedTranslations: LegalContentTranslations = {};

  for (const [rawLocale, value] of Object.entries(translations)) {
    const locale = rawLocale.trim().toLowerCase();
    if (!isSupportedLocale(locale)) {
      throw createError(`Unsupported translation locale: ${rawLocale}`, 400);
    }
    if (locale === DEFAULT_LEGAL_CONTENT_LOCALE) {
      continue;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw createError(`Translation payload is invalid for locale ${locale}`, 400);
    }

    const translation = value as LocalizedLegalContent;
    const normalizedTranslation: LocalizedLegalContent = {};

    if ('title' in translation) {
      const title = normalizeLocalizedTitle(translation.title);
      if (title !== undefined) {
        normalizedTranslation.title = title;
      }
    }

    if ('description' in translation) {
      normalizedTranslation.description = normalizeLocalizedDescription(translation.description);
    }

    if ('blocks' in translation) {
      const blocks = normalizeBlocks(translation.blocks);
      if (blocks.length > 0) {
        normalizedTranslation.blocks = blocks;
      }
    }

    if (Object.keys(normalizedTranslation).length > 0) {
      normalizedTranslations[locale] = normalizedTranslation;
    }
  }

  return normalizedTranslations;
};

const ensureSequelize = () => {
  const sequelizeInstance = LegalContent.sequelize;
  if (!sequelizeInstance) {
    throw createError('Database is not initialized', 500);
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

const createVersionSnapshot = async (
  document: LegalContent,
  transaction: Transaction,
  createdBy?: string | null,
  changeNote?: string | null,
): Promise<void> => {
  await LegalContentVersion.create(
    {
      legalContentId: document.id,
      version: document.version,
      title: document.title,
      description: document.description ?? null,
      blocks: document.blocks || [],
      translations: document.translations || {},
      changeNote: changeNote ?? null,
      createdBy: createdBy ?? null,
    },
    { transaction },
  );
};

const migrateLegacyContentIfAvailable = async (transaction: Transaction): Promise<void> => {
  const sequelizeInstance = ensureSequelize();

  const tables = await sequelizeInstance.query<{ table_name: string }>(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'legal_contents'`,
    { type: QueryTypes.SELECT, transaction },
  );

  if (!tables.length) {
    return;
  }

  const legacyRows = await sequelizeInstance.query<LegacyLegalContentRow>(
    `SELECT id, type, title, content, is_active, updated_by
     FROM legal_contents`,
    { type: QueryTypes.SELECT, transaction },
  );

  for (const legacy of legacyRows) {
    const slug = legacy.type ? normalizeSlug(legacy.type) : '';
    if (!slug) {
      continue;
    }

    const existing = await LegalContent.findOne({
      where: { slug },
      transaction,
    });

    if (existing) {
      continue;
    }

    const blocks = buildDefaultBlocks(
      (legacy.content || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    );

    if (blocks.length === 0) {
      blocks.push(createEmptyParagraphBlock());
    }

    const created = await LegalContent.create(
      {
        slug,
        title: normalizeTitle(legacy.title || slug),
        description: null,
        blocks,
        isActive: Boolean(legacy.is_active),
        isDeleted: false,
        version: 1,
        createdBy: legacy.updated_by || null,
        updatedBy: legacy.updated_by || null,
      },
      { transaction },
    );

    await createVersionSnapshot(created, transaction, legacy.updated_by || null, 'Migrated from legacy table');
  }
};

const ensureSystemDocuments = async (): Promise<void> => {
  await ensureLocalizationColumns();
  const sequelizeInstance = ensureSequelize();
  const transaction = await sequelizeInstance.transaction();

  try {
    await migrateLegacyContentIfAvailable(transaction);

    for (const doc of DEFAULT_SYSTEM_DOCUMENTS) {
      const existing = await LegalContent.findOne({
        where: { slug: doc.slug },
        transaction,
      });

      if (!existing) {
        const created = await LegalContent.create(
          {
            slug: doc.slug,
            title: doc.title,
            description: doc.description,
            blocks: buildDefaultBlocks(doc.body),
            isActive: true,
            isDeleted: false,
            version: 1,
          },
          { transaction },
        );

        await createVersionSnapshot(created, transaction, null, 'Initial system document');
      }
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const isSystemLegalSlug = (slug: string): boolean => {
  return SYSTEM_LEGAL_SLUGS.includes(slug as (typeof SYSTEM_LEGAL_SLUGS)[number]);
};

export const listLegalContent = async (includeDeleted: boolean = false): Promise<LegalContentResponse[]> => {
  await ensureSystemDocuments();

  const whereClause = includeDeleted ? {} : { isDeleted: false };
  const documents = await LegalContent.findAll({
    where: whereClause,
    order: [
      ['isDeleted', 'ASC'],
      ['slug', 'ASC'],
    ],
  });

  return documents.map(formatLegalContent);
};

export const getLegalContentById = async (id: string, includeDeleted: boolean = true): Promise<LegalContentResponse> => {
  await ensureSystemDocuments();
  const document = await LegalContent.findByPk(id);

  if (!document || (!includeDeleted && document.isDeleted)) {
    throw createError('Legal content not found', 404);
  }

  return formatLegalContent(document);
};

export const getLegalContentBySlug = async (slug: string, includeDeleted: boolean = true): Promise<LegalContentResponse> => {
  await ensureSystemDocuments();
  const normalizedSlug = normalizeSlug(slug);
  const document = await LegalContent.findOne({ where: { slug: normalizedSlug } });

  if (!document || (!includeDeleted && document.isDeleted)) {
    throw createError('Legal content not found', 404);
  }

  return formatLegalContent(document);
};

export const createLegalContent = async (
  payload: CreateLegalContentRequest,
  createdBy?: string,
): Promise<LegalContentResponse> => {
  await ensureSystemDocuments();

  const slug = normalizeSlug(payload.slug);
  const title = normalizeTitle(payload.title);
  const description = normalizeDescription(payload.description);
  const blocks = normalizeBlocks(payload.blocks);
  const translations = normalizeTranslations(payload.translations);

  if (blocks.length === 0) {
    throw createError('At least one block is required', 400);
  }

  const existing = await LegalContent.findOne({ where: { slug } });
  if (existing) {
    throw createError('A legal content document with this slug already exists', 409);
  }

  const sequelizeInstance = ensureSequelize();
  const transaction = await sequelizeInstance.transaction();

  try {
    const document = await LegalContent.create(
      {
        slug,
        title,
        description,
        blocks,
        translations,
        isActive: payload.isActive ?? true,
        isDeleted: false,
        version: 1,
        createdBy: createdBy || null,
        updatedBy: createdBy || null,
      },
      { transaction },
    );

    await createVersionSnapshot(document, transaction, createdBy || null, 'Initial version');

    await transaction.commit();
    return formatLegalContent(document);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const updateLegalContent = async (
  id: string,
  payload: UpdateLegalContentRequest,
  updatedBy?: string,
): Promise<LegalContentResponse> => {
  await ensureSystemDocuments();

  const document = await LegalContent.findByPk(id);
  if (!document) {
    throw createError('Legal content not found', 404);
  }
  if (document.isDeleted) {
    throw createError('Cannot update deleted legal content. Restore it first.', 400);
  }

  const hasAnyField =
    payload.title !== undefined ||
    payload.description !== undefined ||
    payload.blocks !== undefined ||
    payload.translations !== undefined ||
    payload.isActive !== undefined;

  if (!hasAnyField) {
    throw createError('At least one field is required for update', 400);
  }

  const changeNote = normalizeChangeNote(payload.changeNote);

  const updateData: Partial<{
    title: string;
    description: string | null;
    blocks: LegalContentBlock[];
    translations: LegalContentTranslations;
    isActive: boolean;
    updatedBy: string | null;
    version: number;
  }> = {
    updatedBy: updatedBy || null,
  };

  if (payload.title !== undefined) {
    updateData.title = normalizeTitle(payload.title);
  }
  if (payload.description !== undefined) {
    updateData.description = normalizeDescription(payload.description);
  }
  if (payload.blocks !== undefined) {
    const blocks = normalizeBlocks(payload.blocks);
    if (blocks.length === 0) {
      throw createError('At least one block is required', 400);
    }
    updateData.blocks = blocks;
  }
  if (payload.translations !== undefined) {
    updateData.translations = normalizeTranslations(payload.translations);
  }
  if (payload.isActive !== undefined) {
    if (typeof payload.isActive !== 'boolean') {
      throw createError('isActive must be boolean', 400);
    }
    updateData.isActive = payload.isActive;
  }

  const sequelizeInstance = ensureSequelize();
  const transaction = await sequelizeInstance.transaction();

  try {
    await document.update(
      {
        ...updateData,
        version: document.version + 1,
      },
      { transaction },
    );

    await createVersionSnapshot(document, transaction, updatedBy || null, changeNote || 'Document updated');

    await transaction.commit();
    return formatLegalContent(document);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const softDeleteLegalContent = async (id: string, deletedBy?: string): Promise<LegalContentResponse> => {
  await ensureSystemDocuments();

  const document = await LegalContent.findByPk(id);
  if (!document) {
    throw createError('Legal content not found', 404);
  }
  if (document.isDeleted) {
    throw createError('Legal content is already deleted', 400);
  }

  await document.update({
    isDeleted: true,
    isActive: false,
    deletedAt: new Date(),
    deletedBy: deletedBy || null,
    updatedBy: deletedBy || null,
  });

  return formatLegalContent(document);
};

export const restoreLegalContent = async (id: string, restoredBy?: string): Promise<LegalContentResponse> => {
  await ensureSystemDocuments();

  const document = await LegalContent.findByPk(id);
  if (!document) {
    throw createError('Legal content not found', 404);
  }
  if (!document.isDeleted) {
    throw createError('Legal content is not deleted', 400);
  }

  await document.update({
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    updatedBy: restoredBy || null,
  });

  return formatLegalContent(document);
};

export const listLegalContentVersions = async (legalContentId: string): Promise<LegalContentVersionResponse[]> => {
  await ensureLocalizationColumns();
  const document = (await LegalContent.findByPk(legalContentId, {
    include: [
      {
        model: LegalContentVersion,
        as: 'versions',
      },
    ],
  })) as LegalContentWithVersions | null;

  if (!document) {
    throw createError('Legal content not found', 404);
  }

  const versions = document.versions || [];
  versions.sort((a, b) => b.version - a.version);
  return versions.map(formatLegalContentVersion);
};

export const revertLegalContentVersion = async (
  legalContentId: string,
  versionId: string,
  updatedBy?: string,
  changeNote?: string,
): Promise<LegalContentResponse> => {
  await ensureLocalizationColumns();
  const document = await LegalContent.findByPk(legalContentId);
  if (!document) {
    throw createError('Legal content not found', 404);
  }
  if (document.isDeleted) {
    throw createError('Cannot revert a deleted legal content document', 400);
  }

  const version = await LegalContentVersion.findOne({
    where: {
      id: versionId,
      legalContentId,
    },
  });

  if (!version) {
    throw createError('Version record not found', 404);
  }

  const note = normalizeChangeNote(changeNote) || `Reverted to version ${version.version}`;
  const sequelizeInstance = ensureSequelize();
  const transaction = await sequelizeInstance.transaction();

  try {
    await document.update(
      {
        title: version.title,
        description: version.description ?? null,
        blocks: normalizeBlocks(version.blocks || []),
        translations: normalizeTranslations(version.translations || {}),
        version: document.version + 1,
        updatedBy: updatedBy || null,
      },
      { transaction },
    );

    await createVersionSnapshot(document, transaction, updatedBy || null, note);

    await transaction.commit();
    return formatLegalContent(document);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
