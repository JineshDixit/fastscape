import { Router } from 'express';
import { getActiveDocuments, getDocumentBySlug } from '../controller/legalContent/legalContent.controller';

const router = Router();

router.get('/', getActiveDocuments);
router.get('/:slug', getDocumentBySlug);

export default router;
