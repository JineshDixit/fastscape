import { Request, Response } from 'express';
import { BaseController } from '../../utils/controller.utils';
import { sendSuccess } from '../../utils/response.utils';
import { legalContentService } from '../../services/legalContent/legalContent.service';

class LegalContentController extends BaseController {
  getActiveDocuments = this.asyncHandler(async (req: Request, res: Response) => {
    const documents = await legalContentService.getActiveDocuments();
    sendSuccess(res, 'Legal documents retrieved successfully', documents);
  });

  getDocumentBySlug = this.asyncHandler(async (req: Request, res: Response) => {
    const document = await legalContentService.getDocumentBySlug(req.params.slug);
    sendSuccess(res, 'Legal document retrieved successfully', document);
  });
}

const legalContentController = new LegalContentController();

export const { getActiveDocuments, getDocumentBySlug } = legalContentController;
