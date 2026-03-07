import { BaseApiService } from '../base';
import type { ApiResponse, LegalDocument, LegalDocumentSummary } from '../../../common/interfaces';

class LegalService extends BaseApiService {
  constructor() {
    super('/legal-content');
  }

  async getDocuments(): Promise<ApiResponse<LegalDocumentSummary[]>> {
    return this.get<LegalDocumentSummary[]>('');
  }

  async getDocumentBySlug(slug: string): Promise<ApiResponse<LegalDocument>> {
    return this.get<LegalDocument>(`/${slug}`);
  }
}

export const legalService = new LegalService();
