import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

// Define types for orders with relations
type OrderWithRelations = {
  id: number;
  status: string;
  total: number;
  createdAt: Date;
  items: Array<{
    id: number;
    quantity: number;
    price: number;
    menuItem: {
      id: number;
      nameEn: string;
      nameKu: string;
      nameAr: string;
    };
  }>;
  table: {
    id: number;
    number: number;
    description: string | null;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

type OrderWithItems = {
  id: number;
  status: string;
  total: number;
  createdAt: Date;
  items: Array<{
    id: number;
    quantity: number;
    price: number;
    menuItem: {
      id: number;
      nameEn: string;
      nameKu: string;
      nameAr: string;
    };
  }>;
};

interface AnalyticsResponse {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  peakHours: { hour: number; orders: number }[];
  topItems: { id: number; name: string; quantity: number; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  dailyTrends: { date: string; orders: number; revenue: number }[];
  weeklyTrends: { week: string; orders: number; revenue: number }[];
  monthlyTrends: { month: string; orders: number; revenue: number }[];
}

export const getAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { period = '7d', year, startDate: startDateParam, endDate: endDateParam } = req.query;

    let startDate: Date;
    let endDate: Date = new Date();
    // If year is specified, use it for year-based calculations
    const selectedYear = year ? parseInt(year as string) : new Date().getFullYear();

    // If custom date range is provided, use it
    if (startDateParam && endDateParam) {
      startDate = startOfDay(new Date(startDateParam as string));
      endDate = endOfDay(new Date(endDateParam as string));
    } else {

      switch (period) {
        case '1d':
          startDate = startOfDay(new Date());
          break;
        case '7d':
          startDate = startOfDay(subDays(endDate, 6));
          break;
        case '30d':
          startDate = startOfDay(subDays(endDate, 29));
          break;
        case '90d':
          startDate = startOfDay(subDays(endDate, 89));
          break;
        case 'year':
          // Full year view
          startDate = startOfYear(new Date(selectedYear, 0, 1));
          endDate = endOfYear(new Date(selectedYear, 11, 31));
          break;
        default:
          startDate = startOfDay(subDays(endDate, 6));
      }

      // Only set endDate to today if not already set (for year view)
      if (period !== 'year') {
        endDate = endOfDay(endDate);
      }
    }

    // Get all orders in the period
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        table: true,
      },
    });

    const completedOrders = orders.filter((order: OrderWithRelations) => order.status === 'COMPLETED');

    // Basic metrics
    const totalOrders = completedOrders.length;
    const totalRevenue = completedOrders.reduce((sum: number, order: OrderWithRelations) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Peak hours analysis
    const hourlyData: { [key: number]: number } = {};
    completedOrders.forEach((order: OrderWithRelations) => {
      const hour = new Date(order.createdAt).getHours();
      hourlyData[hour] = (hourlyData[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourlyData)
      .map(([hour, orders]) => ({ hour: parseInt(hour), orders }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 6);

    // Top items analysis
    const itemData: { [key: number]: { name: string; nameEn: string; nameKu: string; nameAr: string; quantity: number; revenue: number } } = {};
    completedOrders.forEach((order: OrderWithRelations) => {
      order.items.forEach((item: { id: number; quantity: number; price: number; menuItem: { id: number; nameEn: string; nameKu: string; nameAr: string } }) => {
        const itemId = item.menuItem.id;
        if (!itemData[itemId]) {
          itemData[itemId] = {
            name: item.menuItem.nameEn, // Default to English for analytics
            nameEn: item.menuItem.nameEn,
            nameKu: item.menuItem.nameKu,
            nameAr: item.menuItem.nameAr,
            quantity: 0,
            revenue: 0,
          };
        }
        itemData[itemId].quantity += item.quantity;
        itemData[itemId].revenue += item.price * item.quantity;
      });
    });

    const topItems = Object.entries(itemData)
      .map(([id, data]) => ({ id: parseInt(id), ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Orders by status
    const statusCounts = orders.reduce((acc: Record<string, number>, order: OrderWithRelations) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count: count as number,
    }));

    // Daily trends (or monthly trends for year view)
    let dailyTrendsArray: { date: string; orders: number; revenue: number }[] = [];
    
    if (period === 'year') {
      // Monthly trends for year view
      const monthlyTrends: { [key: string]: { orders: number; revenue: number } } = {};
      completedOrders.forEach((order: OrderWithRelations) => {
        const date = new Date(order.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyTrends[monthKey]) {
          monthlyTrends[monthKey] = { orders: 0, revenue: 0 };
        }
        monthlyTrends[monthKey].orders += 1;
        monthlyTrends[monthKey].revenue += order.total;
      });

      // Generate all months for the year, even if no data
      for (let month = 0; month < 12; month++) {
        const monthKey = `${selectedYear}-${String(month + 1).padStart(2, '0')}`;
        const monthName = new Date(selectedYear, month, 1).toLocaleDateString('en', { month: 'short' });
        dailyTrendsArray.push({
          date: monthName,
          orders: monthlyTrends[monthKey]?.orders || 0,
          revenue: monthlyTrends[monthKey]?.revenue || 0,
        });
      }
    } else {
      // Daily trends for other periods
      const dailyTrends: { [key: string]: { orders: number; revenue: number } } = {};
      completedOrders.forEach((order: OrderWithRelations) => {
        const date = new Date(order.createdAt).toISOString().split('T')[0];
        if (!dailyTrends[date]) {
          dailyTrends[date] = { orders: 0, revenue: 0 };
        }
        dailyTrends[date].orders += 1;
        dailyTrends[date].revenue += order.total;
      });

      dailyTrendsArray = Object.entries(dailyTrends)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    // Monthly trends (for year view, same as dailyTrends but formatted differently)
    const monthlyTrendsArray = period === 'year' 
      ? dailyTrendsArray.map(t => ({ month: t.date, orders: t.orders, revenue: t.revenue }))
      : [];

    // Response data
    const analytics: AnalyticsResponse = {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      peakHours,
      topItems,
      ordersByStatus,
      dailyTrends: dailyTrendsArray,
      weeklyTrends: [], // TODO: Implement weekly trends
      monthlyTrends: monthlyTrendsArray,
    };

    res.status(200).json({
      success: true,
      data: { analytics },
    });
  } catch (error) {
    next(error);
  }
};

export const getRevenue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: { message: 'startDate and endDate are required' },
      });
      return;
    }

    const start = startOfDay(new Date(startDate as string));
    const end = endOfDay(new Date(endDate as string));

    // Get all completed orders in the period
    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        table: true,
      },
    });

    const totalRevenue = orders.reduce((sum: number, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Revenue by day
    const revenueByDay: { [key: string]: { revenue: number; orders: number } } = {};
    orders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      if (!revenueByDay[date]) {
        revenueByDay[date] = { revenue: 0, orders: 0 };
      }
      revenueByDay[date].revenue += order.total;
      revenueByDay[date].orders += 1;
    });

    const dailyRevenue = Object.entries(revenueByDay)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.status(200).json({
      success: true,
      data: {
        period: { start, end },
        totalRevenue,
        totalOrders,
        averageOrderValue,
        dailyRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDetailedReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type = 'daily', startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : startOfDay(new Date());
    const end = endDate ? new Date(endDate as string) : endOfDay(new Date());

    // Get all orders in the period
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        table: true,
      },
    }) as OrderWithRelations[];

    const completedOrders = orders.filter((order) => order.status === 'COMPLETED');

    // Calculate various metrics
    const metrics = {
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: orders.filter((order) => order.status === 'CANCELLED').length,
      totalRevenue: completedOrders.reduce((sum: number, order) => sum + order.total, 0),
      averageOrderValue: completedOrders.length > 0
        ? completedOrders.reduce((sum: number, order) => sum + order.total, 0) / completedOrders.length
        : 0,
      averagePreparationTime: 0, // TODO: Calculate from preparation times
      tableTurnover: 0, // TODO: Calculate table turnover times
    };

    // Per-item analysis
    const itemAnalysis = completedOrders.flatMap((order) =>
      order.items.map(item => ({
        id: item.menuItem.id,
        name: item.menuItem.nameEn, // Default to English for analytics
        nameEn: item.menuItem.nameEn,
        nameKu: item.menuItem.nameKu,
        nameAr: item.menuItem.nameAr,
        quantity: item.quantity,
        revenue: item.price * item.quantity,
        price: item.price,
      }))
    );

    // Group by item
    const itemStats = itemAnalysis.reduce((acc: Array<{ id: number; name: string; price: number; totalQuantity: number; totalRevenue: number; orderCount: number }>, item: { id: number; name: string; quantity: number; revenue: number; price: number }) => {
      const existing = acc.find((i: { id: number }) => i.id === item.id);
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalRevenue += item.revenue;
      } else {
        acc.push({
          id: item.id,
          name: item.name,
          price: item.price,
          totalQuantity: item.quantity,
          totalRevenue: item.revenue,
          orderCount: 1,
        });
      }
      return acc;
    }, [] as any[]);

    // Response
    res.status(200).json({
      success: true,
      data: {
        period: { start, end, type },
        metrics,
        itemStats: itemStats.sort((a: { totalQuantity: number }, b: { totalQuantity: number }) => b.totalQuantity - a.totalQuantity),
        orders: completedOrders.slice(0, 100), // Return first 100 orders
      },
    });
  } catch (error) {
    next(error);
  }
};

// Generate daily analytics automatically
export const generateDailyAnalytics = async (): Promise<void> => {
  try {
    const today = startOfDay(new Date());
    const tomorrow = endOfDay(new Date());

    // Check if analytics already exist for today
    const existing = await prisma.analytics.findUnique({
      where: { date: today },
    });

    if (existing) {
      // Update existing analytics
      await updateDailyAnalytics(today, tomorrow);
    } else {
      // Create new analytics
      await createDailyAnalytics(today, tomorrow);
    }
  } catch (error) {
    console.error('Failed to generate daily analytics:', error);
  }
};

async function createDailyAnalytics(startDate: Date, endDate: Date): Promise<void> {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
    },
  });

    const completedOrders = orders.filter((order: OrderWithItems) => order.status === 'COMPLETED');
    const totalOrders = completedOrders.length;
    const totalRevenue = completedOrders.reduce((sum: number, order: OrderWithItems) => sum + (order.total || 0), 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate peak hour
  const hourlyData: { [key: number]: number } = {};
  completedOrders.forEach((order: OrderWithItems) => {
    const hour = new Date(order.createdAt).getHours();
    hourlyData[hour] = (hourlyData[hour] || 0) + 1;
  });

  const peakHour = Object.entries(hourlyData)
    .sort(([,a], [,b]) => b - a)[0]?.[0]
    ? parseInt(Object.entries(hourlyData).sort(([,a], [,b]) => b - a)[0][0])
    : null;

  // Calculate top items
  const itemData: { [key: number]: { name: string; nameEn: string; nameKu: string; nameAr: string; quantity: number } } = {};
  completedOrders.forEach((order: OrderWithItems) => {
    order.items.forEach((item: { id: number; quantity: number; price: number; menuItem: { id: number; nameEn: string; nameKu: string; nameAr: string } }) => {
      const itemId = item.menuItem.id;
      if (!itemData[itemId]) {
        itemData[itemId] = {
          name: item.menuItem.nameEn, // Default to English for analytics
          nameEn: item.menuItem.nameEn,
          nameKu: item.menuItem.nameKu,
          nameAr: item.menuItem.nameAr,
          quantity: 0,
        };
      }
      itemData[itemId].quantity += item.quantity;
    });
  });

  const topItems = Object.entries(itemData)
    .map(([id, data]) => ({ id: parseInt(id), ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Orders by status
  const statusCounts = orders.reduce((acc: Record<string, number>, order: OrderWithItems) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  await prisma.analytics.create({
    data: {
      date: startDate,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      peakHour,
      ordersByStatus: statusCounts,
      topItems,
    },
  });
}

async function updateDailyAnalytics(startDate: Date, endDate: Date): Promise<void> {
  // Similar to createDailyAnalytics but updates existing record
  await prisma.analytics.delete({
    where: { date: startDate },
  });
  await createDailyAnalytics(startDate, endDate);
}