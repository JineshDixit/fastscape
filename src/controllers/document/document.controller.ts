import { Request, Response } from 'express';
import * as documentService from '../../services/document/document.service';
import logger from '../../config/logger';

/**
 * GET /api/documents/pending
 * Get all users with PENDING document verification
 */
export const getPendingDocuments = async (req: Request, res: Response) => {
  try {
    const documents = await documentService.getPendingDocuments();

    res.status(200).json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch pending documents',
        code: 'DOCUMENT_FETCH_ERROR',
      },
    });
  }
};

/**
 * GET /api/documents/user/:userId
 * Get user's identity documents
 */
export const getUserDocuments = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const document = await documentService.getUserDocuments(userId);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'No documents found for this user',
          code: 'DOCUMENT_NOT_FOUND',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch user documents',
        code: 'DOCUMENT_FETCH_ERROR',
      },
    });
  }
};

/**
 * PUT /api/documents/:id/verify
 * Verify (approve) user documents
 */
export const verifyDocuments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    logger.info(`Verifying documents for user identity document ${id}`, { notes });

    const document = await documentService.verifyDocuments(id, notes);

    logger.info(`Documents verified successfully for user identity document ${id}`, {
      userId: document.userId,
      verificationStatus: document.verificationStatus
    });

    res.status(200).json({
      success: true,
      data: document,
      message: 'Documents verified successfully',
    });
  } catch (error: any) {
    logger.error(`Failed to verify documents for identity document ${req.params.id}`, {
      error: error.message,
      stack: error.stack
    });
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to verify documents',
        code: 'VERIFICATION_ERROR',
      },
    });
  }
};

/**
 * PUT /api/documents/:id/reject
 * Reject user documents
 */
export const rejectDocuments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      logger.warn(`Document rejection attempted without reason for identity document ${id}`);
      return res.status(400).json({
        success: false,
        error: {
          message: 'rejectionReason is required',
          code: 'MISSING_REASON',
        },
      });
    }

    logger.info(`Rejecting documents for user identity document ${id}`, { rejectionReason });

    const document = await documentService.rejectDocuments(id, rejectionReason);

    logger.info(`Documents rejected successfully for user identity document ${id}`, {
      userId: document.userId,
      verificationStatus: document.verificationStatus,
      rejectionReason
    });

    res.status(200).json({
      success: true,
      data: document,
      message: 'Documents rejected successfully',
    });
  } catch (error: any) {
    logger.error(`Failed to reject documents for identity document ${req.params.id}`, {
      error: error.message,
      stack: error.stack
    });
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to reject documents',
        code: 'REJECTION_ERROR',
      },
    });
  }
};
