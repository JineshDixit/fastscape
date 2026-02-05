import { UserIdentityDocument, User, sequelize } from '../../models';

/**
 * Get all users with PENDING document verification
 */
export const getPendingDocuments = async (): Promise<UserIdentityDocument[]> => {
  return await UserIdentityDocument.findAll({
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
  const transaction = await sequelize.transaction();

  try {
    const document = await UserIdentityDocument.findByPk(documentId, {
      transaction,
      lock: true,
    });

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.verificationStatus === 'VERIFIED') {
      throw new Error('Document is already verified');
    }

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
    return document;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Reject user documents
 */
export const rejectDocuments = async (documentId: string, rejectionReason: string): Promise<UserIdentityDocument> => {
  const transaction = await sequelize.transaction();

  try {
    const document = await UserIdentityDocument.findByPk(documentId, {
      transaction,
      lock: true,
    });

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.verificationStatus === 'REJECTED') {
      throw new Error('Document is already rejected');
    }

    if (!rejectionReason) {
      throw new Error('Rejection reason is required');
    }

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
    return document;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
