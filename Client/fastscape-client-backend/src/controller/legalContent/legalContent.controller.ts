import { Request, Response } from 'express';
import { BaseController } from '../../utils/controller.utils';
import { sendSuccess } from '../../utils/response.utils';
import { legalContentService } from '../../services/legalContent/legalContent.service';

class LegalContentController extends BaseController {
  getActiveDocuments = this.asyncHandler(async (req: Request, res: Response) => {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined;
    const documents = await legalContentService.getActiveDocuments(locale);
    sendSuccess(res, 'Legal documents retrieved successfully', documents);
  });

  getDocumentBySlug = this.asyncHandler(async (req: Request, res: Response) => {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined;
    const document = await legalContentService.getDocumentBySlug(req.params.slug, locale);
    sendSuccess(res, 'Legal document retrieved successfully', document);
  });
}

const legalContentController = new LegalContentController();

export const { getActiveDocuments, getDocumentBySlug } = legalContentController;
