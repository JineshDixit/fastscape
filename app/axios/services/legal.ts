import { BaseApiService } from '../base';
import type { ApiResponse, LegalContentLocale, LegalDocument, LegalDocumentSummary } from '../../../common/interfaces';

class LegalService extends BaseApiService {
  constructor() {
    super('/legal-content');
  }

  async getDocuments(locale?: LegalContentLocale): Promise<ApiResponse<LegalDocumentSummary[]>> {
    return this.get<LegalDocumentSummary[]>('', {
      params: locale ? { locale } : undefined,
    });
  }

  async getDocumentBySlug(slug: string, locale?: LegalContentLocale): Promise<ApiResponse<LegalDocument>> {
    return this.get<LegalDocument>(`/${slug}`, {
      params: locale ? { locale } : undefined,
    });
  }
}

export const legalService = new LegalService();
