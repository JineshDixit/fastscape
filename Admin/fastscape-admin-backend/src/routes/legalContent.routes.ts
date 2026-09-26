import { Router } from 'express';
import {
  createLegalContentDocument,
  deleteLegalContentDocument,
  getAllLegalContent,
  getLegalContentDocumentById,
  getLegalContentDocumentBySlug,
  getPrivacyPolicyLegacy,
  getRefundCancellationPolicyLegacy,
  getLegalContentDocumentVersions,
  getTermsAndConditionsLegacy,
  restoreLegalContentDocument,
  revertLegalContentDocumentVersion,
  updatePrivacyPolicyLegacy,
  updateRefundCancellationPolicyLegacy,
  updateTermsAndConditionsLegacy,
  updateLegalContentDocument,
} from '../controllers/legalContent/legalContent.controller';
import { authenticateUser, requireActiveUser, requireAnyPermission } from '../services/middleware';

const router = Router();

const LEGAL_READ_ACCESS = [
  'admin.legal.read',
  'admin.legal.update',
  'admin.legal.create',
  'admin.legal.delete',
  'admin.legal.restore',
  'admin.legal.manage',
  'admin.legal.privacy.read',
  'admin.legal.privacy.update',
  'admin.legal.refund.read',
  'admin.legal.refund.update',
  'admin.legal.terms.read',
  'admin.legal.terms.update',
];

router.use(authenticateUser, requireActiveUser);

router.get('/', requireAnyPermission(LEGAL_READ_ACCESS), getAllLegalContent);
router.post('/', requireAnyPermission(['admin.legal.create', 'admin.legal.manage']), createLegalContentDocument);

router.get('/privacy-policy', requireAnyPermission(LEGAL_READ_ACCESS), getPrivacyPolicyLegacy);
router.put(
  '/privacy-policy',
  requireAnyPermission([
    'admin.legal.update',
    'admin.legal.manage',
    'admin.legal.privacy.update',
    'admin.legal.refund.update',
    'admin.legal.terms.update',
  ]),
  updatePrivacyPolicyLegacy,
);

router.get('/refund-cancellation-policy', requireAnyPermission(LEGAL_READ_ACCESS), getRefundCancellationPolicyLegacy);
router.put(
  '/refund-cancellation-policy',
  requireAnyPermission([
    'admin.legal.update',
    'admin.legal.manage',
    'admin.legal.privacy.update',
    'admin.legal.refund.update',
    'admin.legal.terms.update',
  ]),
  updateRefundCancellationPolicyLegacy,
);

router.get('/terms-conditions', requireAnyPermission(LEGAL_READ_ACCESS), getTermsAndConditionsLegacy);
router.put(
  '/terms-conditions',
  requireAnyPermission([
    'admin.legal.update',
    'admin.legal.manage',
    'admin.legal.privacy.update',
    'admin.legal.refund.update',
    'admin.legal.terms.update',
  ]),
  updateTermsAndConditionsLegacy,
);

router.get('/slug/:slug', requireAnyPermission(LEGAL_READ_ACCESS), getLegalContentDocumentBySlug);
router.get('/:id', requireAnyPermission(LEGAL_READ_ACCESS), getLegalContentDocumentById);

router.put(
  '/:id',
  requireAnyPermission([
    'admin.legal.update',
    'admin.legal.manage',
    'admin.legal.privacy.update',
    'admin.legal.refund.update',
    'admin.legal.terms.update',
  ]),
  updateLegalContentDocument,
);

router.delete(
  '/:id',
  requireAnyPermission(['admin.legal.delete', 'admin.legal.manage']),
  deleteLegalContentDocument,
);
router.put(
  '/:id/restore',
  requireAnyPermission(['admin.legal.restore', 'admin.legal.manage']),
  restoreLegalContentDocument,
);

router.get('/:id/versions', requireAnyPermission(LEGAL_READ_ACCESS), getLegalContentDocumentVersions);
router.post(
  '/:id/revert/:versionId',
  requireAnyPermission([
    'admin.legal.update',
    'admin.legal.manage',
    'admin.legal.privacy.update',
    'admin.legal.refund.update',
    'admin.legal.terms.update',
  ]),
  revertLegalContentDocumentVersion,
);

export default router;
