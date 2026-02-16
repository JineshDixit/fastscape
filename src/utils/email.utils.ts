import { Booking, User, Vehicle, Chauffeur } from '../models';
import {
  sendBookingConfirmationEmail,
  sendBookingCancelledEmail,
  sendPaymentConfirmationEmail,
  sendChauffeurAssignedEmail,
} from '../services/email/email.service';
import Logger from './logger';

/**
 * Send booking confirmation email with booking details
 */
export const sendBookingConfirmation = async (bookingId: string): Promise<void> => {
  try {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email', 'firstName'],
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['make', 'model', 'year'],
        },
      ],
    });

    if (!booking) {
      Logger.warn('Booking not found for confirmation email', { bookingId });
      return;
    }

    const user = (booking as any).user;
    const vehicle = (booking as any).vehicle;

    if (!user || !vehicle) {
      Logger.warn('User or vehicle not found for booking confirmation email', { bookingId });
      return;
    }

    const vehicleName = `${vehicle.make} ${vehicle.model} ${vehicle.year}`;
    
    await sendBookingConfirmationEmail(user.email, {
      firstName: user.firstName,
      bookingId: booking.id,
      vehicleName,
      startDate: new Date(booking.startDatetime).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
      }),
      endDate: new Date(booking.endDatetime).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
      }),
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation,
      totalAmount: '0.00', // Will be calculated from financial record
      currency: 'USD',
      bookingType: booking.bookingType,
    });

    Logger.info('Booking confirmation email sent', { bookingId, email: user.email });
  } catch (error) {
    Logger.error('Failed to send booking confirmation email', { bookingId, error });
  }
};

/**
 * Send booking cancellation email
 */
export const sendBookingCancellation = async (bookingId: string): Promise<void> => {
  try {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email', 'firstName'],
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['make', 'model', 'year'],
        },
      ],
    });

    if (!booking) {
      Logger.warn('Booking not found for cancellation email', { bookingId });
      return;
    }

    const user = (booking as any).user;
    const vehicle = (booking as any).vehicle;

    if (!user || !vehicle) {
      Logger.warn('User or vehicle not found for booking cancellation email', { bookingId });
      return;
    }

    const vehicleName = `${vehicle.make} ${vehicle.model} ${vehicle.year}`;

    await sendBookingCancelledEmail(user.email, {
      firstName: user.firstName,
      bookingId: booking.id,
      vehicleName,
      cancellationDate: new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
      }),
    });

    Logger.info('Booking cancellation email sent', { bookingId, email: user.email });
  } catch (error) {
    Logger.error('Failed to send booking cancellation email', { bookingId, error });
  }
};

/**
 * Send payment confirmation email
 */
export const sendPaymentConfirmation = async (
  bookingId: string,
  paymentType: string,
  amount: string,
  currency: string,
  paymentMethod: string
): Promise<void> => {
  try {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email', 'firstName'],
        },
      ],
    });

    if (!booking) {
      Logger.warn('Booking not found for payment confirmation email', { bookingId });
      return;
    }

    const user = (booking as any).user;

    if (!user) {
      Logger.warn('User not found for payment confirmation email', { bookingId });
      return;
    }

    await sendPaymentConfirmationEmail(user.email, {
      firstName: user.firstName,
      bookingId: booking.id,
      paymentType,
      amount,
      currency,
      paymentDate: new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
      }),
      paymentMethod,
    });

    Logger.info('Payment confirmation email sent', { bookingId, email: user.email });
  } catch (error) {
    Logger.error('Failed to send payment confirmation email', { bookingId, error });
  }
};

/**
 * Send chauffeur assignment email
 */
export const sendChauffeurAssignment = async (bookingId: string): Promise<void> => {
  try {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email', 'firstName'],
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['make', 'model', 'year'],
        },
        {
          model: Chauffeur,
          as: 'chauffeur',
          attributes: ['fullName', 'phone', 'rating', 'experienceLevel', 'languages'],
        },
      ],
    });

    if (!booking) {
      Logger.warn('Booking not found for chauffeur assignment email', { bookingId });
      return;
    }

    const user = (booking as any).user;
    const vehicle = (booking as any).vehicle;
    const chauffeur = (booking as any).chauffeur;

    if (!user || !vehicle || !chauffeur) {
      Logger.warn('User, vehicle, or chauffeur not found for chauffeur assignment email', { bookingId });
      return;
    }

    const vehicleName = `${vehicle.make} ${vehicle.model} ${vehicle.year}`;

    await sendChauffeurAssignedEmail(user.email, {
      firstName: user.firstName,
      bookingId: booking.id,
      vehicleName,
      chauffeurName: chauffeur.fullName,
      chauffeurPhone: chauffeur.phone,
      chauffeurRating: chauffeur.rating,
      chauffeurExperience: chauffeur.experienceLevel,
      chauffeurLanguages: chauffeur.languages,
      startDate: new Date(booking.startDatetime).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
      }),
      pickupLocation: booking.pickupLocation,
    });

    Logger.info('Chauffeur assignment email sent', { bookingId, email: user.email });
  } catch (error) {
    Logger.error('Failed to send chauffeur assignment email', { bookingId, error });
  }
};
