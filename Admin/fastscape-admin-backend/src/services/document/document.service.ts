import { UserIdentityDocument, User, sequelize } from '../../models';
import logger from '../../config/logger';

/**
 * Get all users with PENDING document verification
 */
export const getPendingDocuments = async (): Promise<UserIdentityDocument[]> => {
  const startTime = Date.now();
  logger.debug('Fetching pending documents for verification');

  const documents = await UserIdentityDocument.findAll({
    where: {
      verificationStatus: 'PENDING',
    },
    include: [
      {
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'verificationStatus'],
      },
    ],
    order: [['createdAt', 'ASC']],
  });

  const duration = Date.now() - startTime;
  logger.info('Pending documents retrieved', {
    count: documents.length,
    duration: `${duration}ms`,
  });

  return documents;
};

/**
 * Get user's identity documents
 */
export const getUserDocuments = async (userId: string): Promise<UserIdentityDocument | null> => {
  return await UserIdentityDocument.findOne({
    where: { userId },
    include: [
      {
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'verificationStatus'],
      },
    ],
  });
};

/**
 * Verify user documents (approve)
 */
export const verifyDocuments = async (documentId: string, notes?: string): Promise<UserIdentityDocument> => {
  const startTime = Date.now();
  logger.info('Starting document verification', { documentId, notes });

  const transaction = await sequelize.transaction();

  try {
    const document = await UserIdentityDocument.findByPk(documentId, {
      transaction,
      lock: true,
    });

    if (!document) {
      logger.error('Document not found for verification', { documentId });
      throw new Error('Document not found');
    }

    if (document.verificationStatus === 'VERIFIED') {
      logger.warn('Document already verified', {
        documentId,
        userId: document.userId,
      });
      throw new Error('Document is already verified');
    }

    logger.debug('Updating document verification status', {
      documentId,
      userId: document.userId,
      previousStatus: document.verificationStatus,
    });

    // Update document status
    await document.update(
      {
        verificationStatus: 'VERIFIED',
        verified: true,
        verificationDate: new Date(),
      },
      { transaction },
    );

    // Update user's overall verification status
    await User.update(
      {
        verificationStatus: 'VERIFIED',
      },
      {
        where: { id: document.userId },
        transaction,
      },
    );

    await transaction.commit();

    const duration = Date.now() - startTime;
    logger.info('Document verified successfully', {
      documentId,
      userId: document.userId,
      duration: `${duration}ms`,
    });

    return document;
  } catch (error) {
    await transaction.rollback();
    logger.error('Document verification failed, transaction rolled back', {
      documentId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

/**
 * Reject user documents
 */
export const rejectDocuments = async (documentId: string, rejectionReason: string): Promise<UserIdentityDocument> => {
  const startTime = Date.now();
  logger.info('Starting document rejection', { documentId, rejectionReason });

  const transaction = await sequelize.transaction();

  try {
    const document = await UserIdentityDocument.findByPk(documentId, {
      transaction,
      lock: true,
    });

    if (!document) {
      logger.error('Document not found for rejection', { documentId });
      throw new Error('Document not found');
    }

    if (document.verificationStatus === 'REJECTED') {
      logger.warn('Document already rejected', {
        documentId,
        userId: document.userId,
      });
      throw new Error('Document is already rejected');
    }

    if (!rejectionReason) {
      logger.warn('Rejection reason missing', { documentId });
      throw new Error('Rejection reason is required');
    }

    logger.debug('Updating document rejection status', {
      documentId,
      userId: document.userId,
      previousStatus: document.verificationStatus,
      rejectionReason,
    });

    // Update document status
    await document.update(
      {
        verificationStatus: 'REJECTED',
        verified: false,
        verificationDate: new Date(),
      },
      { transaction },
    );

    // Update user's overall verification status
    await User.update(
      {
        verificationStatus: 'REJECTED',
      },
      {
        where: { id: document.userId },
        transaction,
      },
    );

    await transaction.commit();

    const duration = Date.now() - startTime;
    logger.info('Document rejected successfully', {
      documentId,
      userId: document.userId,
      rejectionReason,
      duration: `${duration}ms`,
    });

    return document;
  } catch (error) {
    await transaction.rollback();
    logger.error('Document rejection failed, transaction rolled back', {
      documentId,
      rejectionReason,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};
