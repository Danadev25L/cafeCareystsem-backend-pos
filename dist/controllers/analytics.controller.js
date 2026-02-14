"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDailyAnalytics = exports.getDetailedReport = exports.getRevenue = exports.getAnalytics = void 0;
const db_1 = require("../utils/db");
const date_fns_1 = require("date-fns");
const getAnalytics = async (req, res, next) => {
    try {
        const { period = '7d', year, startDate: startDateParam, endDate: endDateParam } = req.query;
        let startDate;
        let endDate = new Date();
        // If year is specified, use it for year-based calculations
        const selectedYear = year ? parseInt(year) : new Date().getFullYear();
        // If custom date range is provided, use it
        if (startDateParam && endDateParam) {
            startDate = (0, date_fns_1.startOfDay)(new Date(startDateParam));
            endDate = (0, date_fns_1.endOfDay)(new Date(endDateParam));
        }
        else {
            switch (period) {
                case '1d':
                    startDate = (0, date_fns_1.startOfDay)(new Date());
                    break;
                case '7d':
                    startDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(endDate, 6));
                    break;
                case '30d':
                    startDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(endDate, 29));
                    break;
                case '90d':
                    startDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(endDate, 89));
                    break;
                case 'year':
                    // Full year view
                    startDate = (0, date_fns_1.startOfYear)(new Date(selectedYear, 0, 1));
                    endDate = (0, date_fns_1.endOfYear)(new Date(selectedYear, 11, 31));
                    break;
                default:
                    startDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(endDate, 6));
            }
            // Only set endDate to today if not already set (for year view)
            if (period !== 'year') {
                endDate = (0, date_fns_1.endOfDay)(endDate);
            }
        }
        // Get all orders in the period
        const orders = await db_1.prisma.order.findMany({
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
        const completedOrders = orders.filter((order) => order.status === 'COMPLETED');
        // Basic metrics
        const totalOrders = completedOrders.length;
        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
        const totalDiscount = completedOrders.reduce((sum, order) => sum + (order.discount || 0), 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        // Peak hours analysis
        const hourlyData = {};
        completedOrders.forEach((order) => {
            const hour = new Date(order.createdAt).getHours();
            hourlyData[hour] = (hourlyData[hour] || 0) + 1;
        });
        const peakHours = Object.entries(hourlyData)
            .map(([hour, orders]) => ({ hour: parseInt(hour), orders }))
            .sort((a, b) => b.orders - a.orders)
            .slice(0, 6);
        // Top items analysis
        const itemData = {};
        completedOrders.forEach((order) => {
            order.items.forEach((item) => {
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
        const statusCounts = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});
        const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count: count,
        }));
        // Daily trends (or monthly trends for year view)
        let dailyTrendsArray = [];
        if (period === 'year') {
            // Monthly trends for year view
            const monthlyTrends = {};
            completedOrders.forEach((order) => {
                const date = new Date(order.createdAt);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (!monthlyTrends[monthKey]) {
                    monthlyTrends[monthKey] = { orders: 0, revenue: 0, discount: 0 };
                }
                monthlyTrends[monthKey].orders += 1;
                monthlyTrends[monthKey].revenue += order.total;
                monthlyTrends[monthKey].discount += order.discount || 0;
            });
            // Generate all months for the year, even if no data
            for (let month = 0; month < 12; month++) {
                const monthKey = `${selectedYear}-${String(month + 1).padStart(2, '0')}`;
                const monthName = new Date(selectedYear, month, 1).toLocaleDateString('en', { month: 'short' });
                dailyTrendsArray.push({
                    date: monthName,
                    orders: monthlyTrends[monthKey]?.orders || 0,
                    revenue: monthlyTrends[monthKey]?.revenue || 0,
                    discount: monthlyTrends[monthKey]?.discount || 0,
                });
            }
        }
        else {
            // Daily trends for other periods
            const dailyTrends = {};
            completedOrders.forEach((order) => {
                const date = new Date(order.createdAt).toISOString().split('T')[0];
                if (!dailyTrends[date]) {
                    dailyTrends[date] = { orders: 0, revenue: 0, discount: 0 };
                }
                dailyTrends[date].orders += 1;
                dailyTrends[date].revenue += order.total;
                dailyTrends[date].discount += order.discount || 0;
            });
            dailyTrendsArray = Object.entries(dailyTrends)
                .map(([date, data]) => ({ date, ...data }))
                .sort((a, b) => a.date.localeCompare(b.date));
        }
        // Monthly trends (for year view, same as dailyTrends but formatted differently)
        const monthlyTrendsArray = period === 'year'
            ? dailyTrendsArray.map(t => ({ month: t.date, orders: t.orders, revenue: t.revenue, discount: t.discount }))
            : [];
        // Response data
        const analytics = {
            totalOrders,
            totalRevenue,
            totalDiscount,
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
    }
    catch (error) {
        next(error);
    }
};
exports.getAnalytics = getAnalytics;
const getRevenue = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            res.status(400).json({
                success: false,
                error: { message: 'startDate and endDate are required' },
            });
            return;
        }
        const start = (0, date_fns_1.startOfDay)(new Date(startDate));
        const end = (0, date_fns_1.endOfDay)(new Date(endDate));
        // Get all completed orders in the period
        const orders = await db_1.prisma.order.findMany({
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
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        // Revenue by day
        const revenueByDay = {};
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
    }
    catch (error) {
        next(error);
    }
};
exports.getRevenue = getRevenue;
const getDetailedReport = async (req, res, next) => {
    try {
        const { type = 'daily', startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : (0, date_fns_1.startOfDay)(new Date());
        const end = endDate ? new Date(endDate) : (0, date_fns_1.endOfDay)(new Date());
        // Get all orders in the period
        const orders = await db_1.prisma.order.findMany({
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
        });
        const completedOrders = orders.filter((order) => order.status === 'COMPLETED');
        // Calculate various metrics
        const metrics = {
            totalOrders: orders.length,
            completedOrders: completedOrders.length,
            cancelledOrders: orders.filter((order) => order.status === 'CANCELLED').length,
            totalRevenue: completedOrders.reduce((sum, order) => sum + order.total, 0),
            averageOrderValue: completedOrders.length > 0
                ? completedOrders.reduce((sum, order) => sum + order.total, 0) / completedOrders.length
                : 0,
            averagePreparationTime: 0, // TODO: Calculate from preparation times
            tableTurnover: 0, // TODO: Calculate table turnover times
        };
        // Per-item analysis
        const itemAnalysis = completedOrders.flatMap((order) => order.items.map(item => ({
            id: item.menuItem.id,
            name: item.menuItem.nameEn, // Default to English for analytics
            nameEn: item.menuItem.nameEn,
            nameKu: item.menuItem.nameKu,
            nameAr: item.menuItem.nameAr,
            quantity: item.quantity,
            revenue: item.price * item.quantity,
            price: item.price,
        })));
        // Group by item
        const itemStats = itemAnalysis.reduce((acc, item) => {
            const existing = acc.find((i) => i.id === item.id);
            if (existing) {
                existing.totalQuantity += item.quantity;
                existing.totalRevenue += item.revenue;
            }
            else {
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
        }, []);
        // Response
        res.status(200).json({
            success: true,
            data: {
                period: { start, end, type },
                metrics,
                itemStats: itemStats.sort((a, b) => b.totalQuantity - a.totalQuantity),
                orders: completedOrders.slice(0, 100), // Return first 100 orders
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDetailedReport = getDetailedReport;
// Generate daily analytics automatically
const generateDailyAnalytics = async () => {
    try {
        const today = (0, date_fns_1.startOfDay)(new Date());
        const tomorrow = (0, date_fns_1.endOfDay)(new Date());
        // Check if analytics already exist for today
        const existing = await db_1.prisma.analytics.findUnique({
            where: { date: today },
        });
        if (existing) {
            // Update existing analytics
            await updateDailyAnalytics(today, tomorrow);
        }
        else {
            // Create new analytics
            await createDailyAnalytics(today, tomorrow);
        }
    }
    catch (error) {
        console.error('Failed to generate daily analytics:', error);
    }
};
exports.generateDailyAnalytics = generateDailyAnalytics;
async function createDailyAnalytics(startDate, endDate) {
    const orders = await db_1.prisma.order.findMany({
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
    const completedOrders = orders.filter((order) => order.status === 'COMPLETED');
    const totalOrders = completedOrders.length;
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    // Calculate peak hour
    const hourlyData = {};
    completedOrders.forEach((order) => {
        const hour = new Date(order.createdAt).getHours();
        hourlyData[hour] = (hourlyData[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourlyData)
        .sort(([, a], [, b]) => b - a)[0]?.[0]
        ? parseInt(Object.entries(hourlyData).sort(([, a], [, b]) => b - a)[0][0])
        : null;
    // Calculate top items
    const itemData = {};
    completedOrders.forEach((order) => {
        order.items.forEach((item) => {
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
    const statusCounts = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {});
    await db_1.prisma.analytics.create({
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
async function updateDailyAnalytics(startDate, endDate) {
    // Similar to createDailyAnalytics but updates existing record
    await db_1.prisma.analytics.delete({
        where: { date: startDate },
    });
    await createDailyAnalytics(startDate, endDate);
}
//# sourceMappingURL=analytics.controller.js.map