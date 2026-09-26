import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UpdateLegalContentRequest } from '../../common/interfaces/authTypes';
import { sendCreated, sendSuccess } from '../../utils/response.utils';
import {
  createLegalContent,
  getLegalContentById,
  getLegalContentBySlug,
  isSystemLegalSlug,
  listLegalContent,
  listLegalContentVersions,
  restoreLegalContent,
  revertLegalContentVersion,
  softDeleteLegalContent,
  updateLegalContent,
} from '../../services/legalContent/legalContent.service';
import { createError } from '../../services/middleware/errorHandler';

const GENERIC_LEGAL_PERMISSIONS = {
  READ: ['admin.legal.read', 'admin.legal.manage'],
  CREATE: ['admin.legal.create', 'admin.legal.manage'],
  UPDATE: ['admin.legal.update', 'admin.legal.manage'],
  DELETE: ['admin.legal.delete', 'admin.legal.manage'],
  RESTORE: ['admin.legal.restore', 'admin.legal.manage'],
};

const LEGACY_PERMISSION_MAP: Record<string, { read: string[]; update: string[] }> = {
  'privacy-policy': {
    read: ['admin.legal.privacy.read', 'admin.legal.privacy.update'],
    update: ['admin.legal.privacy.update'],
  },
  'refund-cancellation-policy': {
    read: ['admin.legal.refund.read', 'admin.legal.refund.update'],
    update: ['admin.legal.refund.update'],
  },
  'terms-conditions': {
    read: ['admin.legal.terms.read', 'admin.legal.terms.update'],
    update: ['admin.legal.terms.update'],
  },
};

const hasPermission = (req: AuthenticatedRequest, required: string[]): boolean => {
  const user = req.user;
  if (!user) {
    return false;
  }
  const isSuper =
    user.permissions?.includes('admin:all') ||
    user.roles?.some((role) => role.isActive && role.name?.toLowerCase() === 'super-admin');
  if (isSuper) {
    return true;
  }
  return required.some((permission) => user.permissions?.includes(permission));
};

const canReadDocument = (req: AuthenticatedRequest, slug: string): boolean => {
  if (hasPermission(req, GENERIC_LEGAL_PERMISSIONS.READ)) {
    return true;
  }
  if (!isSystemLegalSlug(slug)) {
    return false;
  }
  return hasPermission(req, LEGACY_PERMISSION_MAP[slug]?.read || []);
};

const canUpdateDocument = (req: AuthenticatedRequest, slug: string): boolean => {
  if (hasPermission(req, GENERIC_LEGAL_PERMISSIONS.UPDATE)) {
    return true;
  }
  if (!isSystemLegalSlug(slug)) {
    return false;
  }
  return hasPermission(req, LEGACY_PERMISSION_MAP[slug]?.update || []);
};

const getBySystemSlug = async (
  req: AuthenticatedRequest,
  slug: string,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const document = await getLegalContentBySlug(slug, true);
    if (!canReadDocument(req, slug)) {
      throw createError('Access denied for this legal document', 403);
    }
    sendSuccess(res, 'Legal content retrieved successfully', document);
  } catch (error) {
    next(error);
  }
};

const updateBySystemSlug = async (
  req: AuthenticatedRequest,
  slug: string,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const existing = await getLegalContentBySlug(slug, true);
    if (!canUpdateDocument(req, slug)) {
      throw createError('Access denied for updating this legal document', 403);
    }

    const payload = req.body as UpdateLegalContentRequest;
    const updated = await updateLegalContent(existing.id, payload, req.user?.userId);
    sendSuccess(res, 'Legal content updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const getAllLegalContent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const includeDeleted =
      req.query.includeDeleted === 'true' &&
      hasPermission(req, [
        ...GENERIC_LEGAL_PERMISSIONS.DELETE,
        ...GENERIC_LEGAL_PERMISSIONS.RESTORE,
      ]);
    const allDocuments = await listLegalContent(includeDeleted);

    const documents = allDocuments.filter((doc) => canReadDocument(req, doc.slug));
    sendSuccess(res, 'Legal content retrieved successfully', documents);
  } catch (error) {
    next(error);
  }
};

export const getLegalContentDocumentById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const includeDeleted =
      req.query.includeDeleted === 'true' &&
      hasPermission(req, [
        ...GENERIC_LEGAL_PERMISSIONS.DELETE,
        ...GENERIC_LEGAL_PERMISSIONS.RESTORE,
      ]);
    const document = await getLegalContentById(req.params.id, includeDeleted);

    if (!canReadDocument(req, document.slug)) {
      throw createError('Access denied for this legal document', 403);
    }

    sendSuccess(res, 'Legal content retrieved successfully', document);
  } catch (error) {
    next(error);
  }
};

export const getLegalContentDocumentBySlug = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const includeDeleted =
      req.query.includeDeleted === 'true' &&
      hasPermission(req, [
        ...GENERIC_LEGAL_PERMISSIONS.DELETE,
        ...GENERIC_LEGAL_PERMISSIONS.RESTORE,
      ]);
    const document = await getLegalContentBySlug(req.params.slug, includeDeleted);

    if (!canReadDocument(req, document.slug)) {
      throw createError('Access denied for this legal document', 403);
    }

    sendSuccess(res, 'Legal content retrieved successfully', document);
  } catch (error) {
    next(error);
  }
};

export const getPrivacyPolicyLegacy = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => getBySystemSlug(req, 'privacy-policy', res, next);

export const getRefundCancellationPolicyLegacy = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => getBySystemSlug(req, 'refund-cancellation-policy', res, next);

export const getTermsAndConditionsLegacy = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => getBySystemSlug(req, 'terms-conditions', res, next);

export const createLegalContentDocument = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!hasPermission(req, GENERIC_LEGAL_PERMISSIONS.CREATE)) {
      throw createError('Access denied. Missing legal content create permission.', 403);
    }

    const document = await createLegalContent(req.body, req.user?.userId);
    sendCreated(res, 'Legal content created successfully', document);
  } catch (error) {
    next(error);
  }
};

export const updateLegalContentDocument = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const existing = await getLegalContentById(req.params.id, true);

    if (!canUpdateDocument(req, existing.slug)) {
      throw createError('Access denied for updating this legal document', 403);
    }

    const payload = req.body as UpdateLegalContentRequest;
    const updated = await updateLegalContent(req.params.id, payload, req.user?.userId);
    sendSuccess(res, 'Legal content updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const updatePrivacyPolicyLegacy = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => updateBySystemSlug(req, 'privacy-policy', res, next);

export const updateRefundCancellationPolicyLegacy = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => updateBySystemSlug(req, 'refund-cancellation-policy', res, next);

export const updateTermsAndConditionsLegacy = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => updateBySystemSlug(req, 'terms-conditions', res, next);

export const deleteLegalContentDocument = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!hasPermission(req, GENERIC_LEGAL_PERMISSIONS.DELETE)) {
      throw createError('Access denied. Missing legal content delete permission.', 403);
    }
    const deleted = await softDeleteLegalContent(req.params.id, req.user?.userId);
    sendSuccess(res, 'Legal content deleted successfully', deleted);
  } catch (error) {
    next(error);
  }
};

export const restoreLegalContentDocument = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!hasPermission(req, GENERIC_LEGAL_PERMISSIONS.RESTORE)) {
      throw createError('Access denied. Missing legal content restore permission.', 403);
    }
    const restored = await restoreLegalContent(req.params.id, req.user?.userId);
    sendSuccess(res, 'Legal content restored successfully', restored);
  } catch (error) {
    next(error);
  }
};

export const getLegalContentDocumentVersions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const existing = await getLegalContentById(req.params.id, true);
    if (!canReadDocument(req, existing.slug)) {
      throw createError('Access denied for this legal document versions', 403);
    }

    const versions = await listLegalContentVersions(req.params.id);
    sendSuccess(res, 'Legal content versions retrieved successfully', versions);
  } catch (error) {
    next(error);
  }
};

export const revertLegalContentDocumentVersion = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const existing = await getLegalContentById(req.params.id, true);
    if (!canUpdateDocument(req, existing.slug)) {
      throw createError('Access denied for reverting this legal document', 403);
    }

    const reverted = await revertLegalContentVersion(
      req.params.id,
      req.params.versionId,
      req.user?.userId,
      typeof req.body?.changeNote === 'string' ? req.body.changeNote : undefined,
    );
    sendSuccess(res, 'Legal content version reverted successfully', reverted);
  } catch (error) {
    next(error);
  }
};
