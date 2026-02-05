import { Request, Response } from 'express';
import * as paymentService from '../../services/payment/payment.service';

/**
 * GET /api/payments
 * Get all payments with filters and pagination
 */
export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const filters = {
      bookingId: req.query.bookingId as string,
      userId: req.query.userId as string,
      paymentType: req.query.paymentType as string,
      paymentStatus: req.query.paymentStatus as string,
      paymentMethod: req.query.paymentMethod as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await paymentService.getAllPayments(filters);

    res.status(200).json({
      success: true,
      data: result.payments,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch payments',
        code: 'PAYMENT_FETCH_ERROR',
      },
    });
  }
};

/**
 * GET /api/payments/:id
 * Get single payment details
 */
export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payment = await paymentService.getPaymentById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Payment not found',
          code: 'PAYMENT_NOT_FOUND',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch payment',
        code: 'PAYMENT_FETCH_ERROR',
      },
    });
  }
};

/**
 * GET /api/payments/summary/:bookingId
 * Get payment summary for a booking
 */
export const getPaymentSummary = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    const summary = await paymentService.getPaymentSummary(bookingId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch payment summary',
        code: 'SUMMARY_FETCH_ERROR',
      },
    });
  }
};

/**
 * GET /api/payments/overdue
 * Get all overdue payments
 */
export const getOverduePayments = async (req: Request, res: Response) => {
  try {
    const payments = await paymentService.getOverduePayments();

    res.status(200).json({
      success: true,
      data: payments,
      count: payments.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch overdue payments',
        code: 'OVERDUE_FETCH_ERROR',
      },
    });
  }
};

/**
 * PUT /api/payments/:id/mark-paid
 * Mark a payment as paid (admin override)
 */
export const markPaymentPaid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paidAt, notes } = req.body;

    const payment = await paymentService.markPaymentPaid(id, paidAt ? new Date(paidAt) : undefined, notes);

    res.status(200).json({
      success: true,
      data: payment,
      message: 'Payment marked as paid successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to mark payment as paid',
        code: 'MARK_PAID_ERROR',
      },
    });
  }
};

/**
 * POST /api/payments/refund/:bookingId
 * Process a refund for a booking
 */
export const processRefund = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { refundAmount, reason, stripeRefundId } = req.body;

    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'refundAmount is required and must be greater than 0',
          code: 'INVALID_REFUND_AMOUNT',
        },
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'reason is required for processing refunds',
          code: 'MISSING_REASON',
        },
      });
    }

    const result = await paymentService.processRefund(bookingId, parseFloat(refundAmount), reason, stripeRefundId);

    res.status(200).json({
      success: true,
      data: result,
      message: `Refund of $${refundAmount} processed successfully`,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to process refund',
        code: 'REFUND_ERROR',
      },
    });
  }
};
