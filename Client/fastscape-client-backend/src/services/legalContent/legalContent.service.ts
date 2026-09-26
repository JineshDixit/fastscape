import { LegalContent } from '../../models';
import { LegalContentBlock } from '../../models/legalContent.model';
import { createError } from '../middleware/errorHandler';

const ACTIVE_LEGAL_DOCUMENT_WHERE = {
  isActive: true,
  isDeleted: false,
};

export interface LegalDocumentSummary {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  version: number;
  updatedAt: Date;
}

export interface LegalDocumentDetail extends LegalDocumentSummary {
  blocks: LegalContentBlock[];
  createdAt: Date;
}

class LegalContentService {
  async getActiveDocuments(): Promise<LegalDocumentSummary[]> {
    const documents = await LegalContent.findAll({
      where: ACTIVE_LEGAL_DOCUMENT_WHERE,
      attributes: ['id', 'slug', 'title', 'description', 'version', 'updatedAt'],
      order: [
        ['title', 'ASC'],
        ['updatedAt', 'DESC'],
      ],
    });

    return documents.map((document) => document.toJSON() as LegalDocumentSummary);
  }

  async getDocumentBySlug(slug: string): Promise<LegalDocumentDetail> {
    const normalizedSlug = slug.trim().toLowerCase();

    if (!normalizedSlug) {
      throw createError('Legal document slug is required', 400, 'LEGAL_CONTENT_SLUG_REQUIRED');
    }

    const document = await LegalContent.findOne({
      where: {
        ...ACTIVE_LEGAL_DOCUMENT_WHERE,
        slug: normalizedSlug,
      },
      attributes: ['id', 'slug', 'title', 'description', 'blocks', 'version', 'createdAt', 'updatedAt'],
    });

    if (!document) {
      throw createError('Legal document not found', 404, 'LEGAL_CONTENT_NOT_FOUND');
    }

    return document.toJSON() as LegalDocumentDetail;
  }
}

export const legalContentService = new LegalContentService();
