import { Op } from 'sequelize';
import { BookingFinancial, Booking, User, Vehicle, Payment, sequelize } from '../../models';
import logger from '../../config/logger';

interface FinanceFilters {
  paymentStatus?: string;
  bookingStatus?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface FinanceListResult {
  financials: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get all booking financials with filtering and pagination
 */
export const getAllFinancials = async (filters: FinanceFilters): Promise<FinanceListResult> => {
  const startTime = Date.now();
  logger.debug('Fetching financials with filters', { filters });

  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 100);
  const offset = (page - 1) * limit;

  const where: any = {};
  const bookingWhere: any = {};

  if (filters.paymentStatus) {
    bookingWhere.paymentStatus = filters.paymentStatus;
  }

  if (filters.bookingStatus) {
    bookingWhere.bookingStatus = filters.bookingStatus;
  }

  if (filters.startDate) {
    bookingWhere.startDatetime = {
      [Op.gte]: new Date(filters.startDate),
    };
  }

  if (filters.endDate) {
    bookingWhere.endDatetime = {
      [Op.lte]: new Date(filters.endDate),
    };
  }

  // Server-side search logic
  if (filters.search) {
    const searchCondition = {
      [Op.or]: [
        { '$Booking.id$': { [Op.iLike]: `%${filters.search}%` } },
        { '$Booking.User.firstName$': { [Op.iLike]: `%${filters.search}%` } },
        { '$Booking.User.lastName$': { [Op.iLike]: `%${filters.search}%` } },
        { '$Booking.Vehicle.make$': { [Op.iLike]: `%${filters.search}%` } },
        { '$Booking.Vehicle.model$': { [Op.iLike]: `%${filters.search}%` } },
      ],
    };
    Object.assign(where, searchCondition);
  }

  // Sorting logic
  let order: any = [['createdAt', 'DESC']];
  if (filters.sortBy) {
    const sortOrder = filters.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const field = filters.sortBy;

    if (field === 'clientName') {
      order = [[{ model: Booking, as: 'Booking' }, { model: User, as: 'User' }, 'firstName', sortOrder]];
    } else if (field === 'carModel') {
      order = [[{ model: Booking, as: 'Booking' }, { model: Vehicle, as: 'Vehicle' }, 'model', sortOrder]];
    } else if (field === 'totalAmount' || field === 'paidAmount' || field === 'remainingAmount') {
      order = [[field, sortOrder]];
    } else if (field === 'dueDate') {
      order = [[{ model: Booking, as: 'Booking' }, 'endDatetime', sortOrder]];
    } else {
      order = [['createdAt', sortOrder]];
    }
  }

  const { rows: financials, count: total } = await BookingFinancial.findAndCountAll({
    where,
    include: [
      {
        model: Booking,
        where: bookingWhere,
        required: true,
        include: [
          {
            model: User,
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
          },
          {
            model: Vehicle,
            attributes: ['id', 'make', 'model', 'year', 'bodyType'],
          },
        ],
      },
    ],
    order,
    limit,
    offset,
  });

  const duration = Date.now() - startTime;
  logger.info('Financials fetched successfully', {
    count: financials.length,
    total,
    page,
    duration: `${duration}ms`,
  });

  return {
    financials,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single financial record with full details
 */
export const getFinancialById = async (bookingId: string) => {
  logger.debug('Fetching financial by booking ID', { bookingId });

  const financial = await BookingFinancial.findOne({
    where: { bookingId },
    include: [
      {
        model: Booking,
        include: [
          {
            model: User,
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
          },
          {
            model: Vehicle,
            attributes: ['id', 'make', 'model', 'year', 'bodyType'],
          },
        ],
      },
    ],
  });

  if (!financial) {
    logger.warn('Financial record not found', { bookingId });
    return null;
  }

  // Get all payments for this booking
  const payments = await Payment.findAll({
    where: { bookingId },
    order: [['createdAt', 'DESC']],
  });

  logger.debug('Financial record found', {
    bookingId,
    totalAmount: financial.totalAmount,
    paidAmount: financial.paidAmount,
    paymentsCount: payments.length,
  });

  return {
    ...financial.toJSON(),
    Payments: payments,
  };
};

/**
 * Get financial statistics
 */
export const getFinancialStats = async () => {
  const startTime = Date.now();
  logger.debug('Calculating financial statistics');

  // Get completed payments (PAID status)
  const completedResult = await BookingFinancial.findAll({
    attributes: [[sequelize.fn('COUNT', sequelize.col('BookingFinancial.id')), 'count']],
    include: [
      {
        model: Booking,
        attributes: [],
        where: { paymentStatus: 'PAID' },
        required: true,
      },
    ],
    raw: true,
  });

  const completedCount = parseInt((completedResult[0] as any).count || '0');

  const completedAmountResult = await BookingFinancial.findAll({
    attributes: [[sequelize.fn('SUM', sequelize.col('BookingFinancial.total_amount')), 'total']],
    include: [
      {
        model: Booking,
        attributes: [],
        where: { paymentStatus: 'PAID' },
        required: true,
      },
    ],
    raw: true,
  });

  const completedAmount = parseFloat((completedAmountResult[0] as any).total || '0');

  // Get awaiting payments (UNPAID, PARTIALLY_PAID)
  const awaitingResult = await BookingFinancial.findAll({
    attributes: [[sequelize.fn('COUNT', sequelize.col('BookingFinancial.id')), 'count']],
    include: [
      {
        model: Booking,
        attributes: [],
        where: {
          paymentStatus: {
            [Op.in]: ['UNPAID', 'PARTIALLY_PAID'],
          },
        },
        required: true,
      },
    ],
    raw: true,
  });

  const awaitingCount = parseInt((awaitingResult[0] as any).count || '0');

  const awaitingAmountResult = await BookingFinancial.findAll({
    attributes: [[sequelize.fn('SUM', sequelize.col('BookingFinancial.remaining_amount')), 'total']],
    include: [
      {
        model: Booking,
        attributes: [],
        where: {
          paymentStatus: {
            [Op.in]: ['UNPAID', 'PARTIALLY_PAID'],
          },
        },
        required: true,
      },
    ],
    raw: true,
  });

  const awaitingAmount = parseFloat((awaitingAmountResult[0] as any).total || '0');

  // Get overdue payments (OVERDUE status)
  const overdueResult = await BookingFinancial.findAll({
    attributes: [[sequelize.fn('COUNT', sequelize.col('BookingFinancial.id')), 'count']],
    include: [
      {
        model: Booking,
        attributes: [],
        where: { paymentStatus: 'OVERDUE' },
        required: true,
      },
    ],
    raw: true,
  });

  const overdueCount = parseInt((overdueResult[0] as any).count || '0');

  const overdueAmountResult = await BookingFinancial.findAll({
    attributes: [[sequelize.fn('SUM', sequelize.col('BookingFinancial.remaining_amount')), 'total']],
    include: [
      {
        model: Booking,
        attributes: [],
        where: { paymentStatus: 'OVERDUE' },
        required: true,
      },
    ],
    raw: true,
  });

  const overdueAmount = parseFloat((overdueAmountResult[0] as any).total || '0');

  const duration = Date.now() - startTime;
  logger.info('Financial statistics calculated', {
    completedCount,
    awaitingCount,
    overdueCount,
    duration: `${duration}ms`,
  });

  return {
    completed: {
      count: completedCount,
      amount: completedAmount,
    },
    awaiting: {
      count: awaitingCount,
      amount: awaitingAmount,
    },
    overdue: {
      count: overdueCount,
      amount: overdueAmount,
    },
  };
};

/**
 * Export financials to CSV with filters
 */
export const exportFinancialsToCSV = async (filters: FinanceFilters): Promise<BookingFinancial[]> => {
  const where: any = {};
  const bookingWhere: any = {};

  if (filters.paymentStatus) {
    bookingWhere.paymentStatus = filters.paymentStatus;
  }

  if (filters.startDate) {
    bookingWhere.startDatetime = {
      [Op.gte]: new Date(filters.startDate),
    };
  }

  if (filters.endDate) {
    bookingWhere.endDatetime = {
      [Op.lte]: new Date(filters.endDate),
    };
  }

  if (filters.search) {
    const searchCondition = {
      [Op.or]: [
        { bookingId: { [Op.iLike]: `%${filters.search}%` } },
        { '$Booking.User.firstName$': { [Op.iLike]: `%${filters.search}%` } },
        { '$Booking.User.lastName$': { [Op.iLike]: `%${filters.search}%` } },
        { '$Booking.Vehicle.make$': { [Op.iLike]: `%${filters.search}%` } },
        { '$Booking.Vehicle.model$': { [Op.iLike]: `%${filters.search}%` } },
      ],
    };
    Object.assign(where, searchCondition);
  }

  const financials = await BookingFinancial.findAll({
    where,
    include: [
      {
        model: Booking,
        where: bookingWhere,
        include: [
          {
            model: User,
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
          },
          {
            model: Vehicle,
            attributes: ['id', 'make', 'model', 'year'],
          },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: 5000,
  });

  return financials;
};
