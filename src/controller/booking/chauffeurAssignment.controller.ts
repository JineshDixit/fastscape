import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/expressTypes';
import { assignChauffeurToBooking } from '../../services/booking/chauffeurAssignment.service';
import { BaseController } from '../../utils/controller.utils';
import { sendSuccess } from '../../utils/response.utils';

class ChauffeurAssignmentController extends BaseController {
  /**
   * Check chauffeur assignment status for a booking
   */
  checkAssignmentStatus = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = this.getValidatedId(req, 'bookingId');

    const { Booking, Chauffeur } = await import('../../models');

    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: Chauffeur,
          as: 'chauffeur',
          attributes: ['id', 'fullName', 'phone', 'rating', 'experienceLevel'],
          required: false,
        },
      ],
      attributes: ['id', 'bookingType', 'paymentStatus', 'bookingStatus', 'chauffeurId'],
    });

    if (!booking) {
      return sendSuccess(res, 'Booking not found', null, 404);
    }

    const isEligible =
      booking.bookingType === 'CHAUFFEUR' &&
      booking.paymentStatus === 'PAID' &&
      !booking.chauffeurId &&
      ['CONFIRMED', 'PICKED_UP'].includes(booking.bookingStatus);

    sendSuccess(res, 'Assignment status retrieved', {
      bookingId,
      bookingType: booking.bookingType,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      chauffeurId: booking.chauffeurId,
      chauffeur: (booking as any).chauffeur,
      isEligibleForAssignment: isEligible,
    });
  });
}

const chauffeurAssignmentController = new ChauffeurAssignmentController();

export const { checkAssignmentStatus } = chauffeurAssignmentController;
