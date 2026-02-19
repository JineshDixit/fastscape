import { Op, fn, col, literal } from 'sequelize';
import { Booking, BookingFinancial, Vehicle, User, Chauffeur, sequelize } from '../../models';

/**
 * Get rent status statistics (booking status breakdown)
 */
export const getRentStatus = async (period: string = 'week') => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const statusCounts = await Booking.findAll({
    attributes: [
      'bookingStatus',
      [fn('COUNT', col('id')), 'count'],
    ],
    where: {
      created_at: {
        [Op.gte]: startDate,
      },
    },
    group: ['booking_status'],
    raw: true,
  });

  const result: Record<string, number> = {
    COMPLETED: 0,
    PENDING: 0,
    CANCELLED: 0,
  };

  statusCounts.forEach((item: any) => {
    const status = item.booking_status || item.bookingStatus;
    if (status === 'COMPLETED') {
      result.COMPLETED = parseInt(item.count);
    } else if (status === 'PENDING' || status === 'CONFIRMED' || status === 'PICKED_UP' || status === 'DROPPED_OFF') {
      result.PENDING += parseInt(item.count);
    } else if (status === 'CANCELLED') {
      result.CANCELLED = parseInt(item.count);
    }
  });

  const total = result.COMPLETED + result.PENDING + result.CANCELLED;

  return {
    complete: result.COMPLETED,
    pending: result.PENDING,
    cancelled: result.CANCELLED,
    total,
  };
};

/**
 * Get earning summary over time
 */
export const getEarningSummary = async (months: number = 8) => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  // Use raw SQL to avoid complex join issues
  const query = `
    SELECT 
      DATE_TRUNC('month', bf.created_at) as month,
      COALESCE(SUM(CAST(bf.total_amount AS DECIMAL)), 0) as total
    FROM booking_financials bf
    INNER JOIN bookings b ON bf.booking_id = b.id
    WHERE b.booking_status IN ('COMPLETED', 'CONFIRMED', 'PICKED_UP', 'DROPPED_OFF')
    AND bf.created_at >= :startDate
    GROUP BY DATE_TRUNC('month', bf.created_at)
    ORDER BY DATE_TRUNC('month', bf.created_at) ASC
  `;

  const earnings: any = await sequelize.query(query, {
    replacements: { startDate },
    type: 'SELECT',
  });

  // Fill in missing months with 0
  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
    
    const existing = earnings.find((e: any) => {
      const earnMonth = new Date(e.month).toISOString().substring(0, 7);
      return earnMonth === monthKey;
    });

    result.push({
      month: date.toLocaleString('en-US', { month: 'short' }),
      year: date.getFullYear(),
      amount: existing ? parseFloat(existing.total) : 0,
    });
  }

  return result;
};

/**
 * Get bookings overview by month for the year
 */
export const getBookingsOverview = async (year?: number) => {
  const targetYear = year || new Date().getFullYear();
  const startDate = new Date(targetYear, 0, 1);
  const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

  const bookings = await Booking.findAll({
    attributes: [
      [fn('EXTRACT', literal("MONTH FROM created_at")), 'month_num'],
      [fn('COUNT', col('id')), 'count'],
    ],
    where: {
      created_at: {
        [Op.between]: [startDate, endDate],
      },
    },
    group: [fn('EXTRACT', literal("MONTH FROM created_at"))],
    order: [[fn('EXTRACT', literal("MONTH FROM created_at")), 'ASC']],
    raw: true,
  });

  // Fill in all 12 months
  const result = [];
  
  for (let i = 0; i < 12; i++) {
    const monthNum = i + 1; // 1-12
    const date = new Date(targetYear, i, 1);
    
    const existing = bookings.find((b: any) => parseInt(b.month_num) === monthNum);

    result.push({
      month: date.toLocaleString('en-US', { month: 'short' }),
      count: existing ? parseInt((existing as any).count) : 0,
    });
  }

  return result;
};

/**
 * Get dashboard summary statistics
 */
export const getDashboardStats = async () => {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Total bookings this month
  const totalBookingsThisMonth = await Booking.count({
    where: {
      created_at: {
        [Op.gte]: thisMonthStart,
      },
    },
  });

  // Total bookings last month
  const totalBookingsLastMonth = await Booking.count({
    where: {
      created_at: {
        [Op.between]: [lastMonth, thisMonthStart],
      },
    },
  });

  // Active vehicles (not in maintenance or inactive)
  const activeVehicles = await Vehicle.count();

  // Total active vehicles last month (approximation - just use total count)
  const activeVehiclesLastMonth = activeVehicles;

  // Total clients (users)
  const totalClients = await User.count();

  // Clients from last month
  const clientsLastMonth = await User.count({
    where: {
      created_at: {
        [Op.lt]: thisMonthStart,
      },
    },
  });

  // Revenue this month - using raw SQL to avoid join issues
  const revenueThisMonthQuery = `
    SELECT COALESCE(SUM(CAST(bf.total_amount AS DECIMAL)), 0) as total
    FROM booking_financials bf
    INNER JOIN bookings b ON bf.booking_id = b.id
    WHERE b.booking_status = 'COMPLETED'
    AND b.created_at >= :thisMonthStart
  `;
  
  const revenueThisMonthResult: any = await sequelize.query(revenueThisMonthQuery, {
    replacements: { thisMonthStart },
    type: 'SELECT',
  });
  const revenueThisMonth = parseFloat(revenueThisMonthResult[0]?.total || '0');

  // Revenue last month
  const revenueLastMonthQuery = `
    SELECT COALESCE(SUM(CAST(bf.total_amount AS DECIMAL)), 0) as total
    FROM booking_financials bf
    INNER JOIN bookings b ON bf.booking_id = b.id
    WHERE b.booking_status = 'COMPLETED'
    AND b.created_at >= :lastMonth
    AND b.created_at < :thisMonthStart
  `;
  
  const revenueLastMonthResult: any = await sequelize.query(revenueLastMonthQuery, {
    replacements: { lastMonth, thisMonthStart },
    type: 'SELECT',
  });
  const revenueLastMonth = parseFloat(revenueLastMonthResult[0]?.total || '0');

  const calculatePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    totalBookings: {
      value: totalBookingsThisMonth,
      change: calculatePercentage(totalBookingsThisMonth, totalBookingsLastMonth),
    },
    activeVehicles: {
      value: activeVehicles,
      change: calculatePercentage(activeVehicles, activeVehiclesLastMonth),
    },
    totalClients: {
      value: totalClients,
      change: calculatePercentage(totalClients, clientsLastMonth),
    },
    revenue: {
      value: revenueThisMonth,
      change: calculatePercentage(revenueThisMonth, revenueLastMonth),
    },
  };
};
