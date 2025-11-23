"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreparationStats = exports.getKitchenQueue = exports.completePreparation = exports.startPreparation = void 0;
const db_1 = require("../utils/db");
const startPreparation = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'User not authenticated' },
            });
            return;
        }
        // Check if order exists and is in PREPARING status
        const order = await db_1.prisma.order.findUnique({
            where: { id: parseInt(orderId) },
        });
        if (!order) {
            res.status(404).json({
                success: false,
                error: { message: 'Order not found' },
            });
            return;
        }
        if (order.status !== 'PREPARING') {
            res.status(400).json({
                success: false,
                error: { message: 'Order must be in PREPARING status to start preparation' },
            });
            return;
        }
        // Check if preparation already started
        const existingPrepTime = await db_1.prisma.preparationTime.findFirst({
            where: {
                orderId: parseInt(orderId),
                status: 'PREPARING',
            },
        });
        if (existingPrepTime) {
            res.status(400).json({
                success: false,
                error: { message: 'Preparation already started for this order' },
            });
            return;
        }
        // Start preparation timer
        const preparationTime = await db_1.prisma.preparationTime.create({
            data: {
                orderId: parseInt(orderId),
                startTime: new Date(),
                status: 'PREPARING',
            },
        });
        res.status(200).json({
            success: true,
            data: { preparationTime },
            message: 'Preparation started successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.startPreparation = startPreparation;
const completePreparation = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'User not authenticated' },
            });
            return;
        }
        // Find active preparation time
        const preparationTime = await db_1.prisma.preparationTime.findFirst({
            where: {
                orderId: parseInt(orderId),
                status: 'PREPARING',
            },
        });
        if (!preparationTime) {
            res.status(404).json({
                success: false,
                error: { message: 'No active preparation found for this order' },
            });
            return;
        }
        const endTime = new Date();
        const duration = Math.round((endTime.getTime() - preparationTime.startTime.getTime()) / (1000 * 60)); // Duration in minutes
        // Update preparation time
        const updatedPrepTime = await db_1.prisma.preparationTime.update({
            where: { id: preparationTime.id },
            data: {
                endTime,
                duration,
                status: 'COMPLETED',
            },
        });
        // Update order status to READY
        const updatedOrder = await db_1.prisma.order.update({
            where: { id: parseInt(orderId) },
            data: { status: 'READY' },
            include: {
                items: {
                    include: {
                        menuItem: true,
                    },
                },
                table: true,
            },
        });
        res.status(200).json({
            success: true,
            data: {
                preparationTime: updatedPrepTime,
                order: updatedOrder,
            },
            message: 'Preparation completed successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.completePreparation = completePreparation;
const getKitchenQueue = async (req, res, next) => {
    try {
        const { status = 'PREPARING' } = req.query;
        const orders = await db_1.prisma.order.findMany({
            where: {
                status: status,
            },
            include: {
                items: {
                    include: {
                        menuItem: true,
                    },
                },
                table: true,
                preparationTime: {
                    where: {
                        status: 'PREPARING',
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                },
            },
            orderBy: [
                { priority: 'desc' }, // Higher priority first
                { isRush: 'desc' }, // Rush orders first
                { createdAt: 'asc' }, // Older orders first
            ],
        });
        // Calculate preparation time for each order
        const ordersWithPrepTime = orders.map((order) => {
            const prepTime = order.preparationTime[0];
            const currentPrepTime = prepTime
                ? Math.round((new Date().getTime() - prepTime.startTime.getTime()) / (1000 * 60))
                : 0;
            return {
                ...order,
                currentPrepTime,
                estimatedPrepTime: estimatePrepTime(order),
                priority: getPriorityLevel(order),
            };
        });
        res.status(200).json({
            success: true,
            data: {
                orders: ordersWithPrepTime,
                queueStats: {
                    totalOrders: orders.length,
                    rushOrders: orders.filter((o) => o.isRush).length,
                    highPriorityOrders: orders.filter((o) => o.priority === 'HIGH' || o.priority === 'URGENT').length,
                    averagePrepTime: calculateAveragePrepTime(orders),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getKitchenQueue = getKitchenQueue;
const getPreparationStats = async (req, res, next) => {
    try {
        const { period = '7d' } = req.query;
        let startDate;
        let endDate = new Date();
        switch (period) {
            case '1d':
                startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
        // Get completed preparation times
        const prepTimes = await db_1.prisma.preparationTime.findMany({
            where: {
                status: 'COMPLETED',
                endTime: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                order: {
                    include: {
                        items: {
                            include: {
                                menuItem: true,
                            },
                        },
                    },
                },
            },
        });
        // Calculate statistics
        const totalPreparations = prepTimes.length;
        const averagePrepTime = totalPreparations > 0
            ? prepTimes.reduce((sum, prep) => sum + (prep.duration || 0), 0) / totalPreparations
            : 0;
        // Preparation time by item count
        const prepTimeByItemCount = {};
        prepTimes.forEach((prep) => {
            const itemCount = prep.order.items.length;
            if (!prepTimeByItemCount[itemCount]) {
                prepTimeByItemCount[itemCount] = [];
            }
            if (prep.duration) {
                prepTimeByItemCount[itemCount].push(prep.duration);
            }
        });
        const itemCountStats = Object.entries(prepTimeByItemCount).map(([count, times]) => ({
            itemCount: parseInt(count),
            averageTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
            minTime: Math.min(...times),
            maxTime: Math.max(...times),
            count: times.length,
        }));
        // Daily trends
        const dailyStats = {};
        prepTimes.forEach((prep) => {
            const date = prep.endTime.toISOString().split('T')[0];
            if (!dailyStats[date]) {
                dailyStats[date] = { count: 0, averageTime: 0, totalTime: 0 };
            }
            dailyStats[date].count += 1;
            if (prep.duration) {
                dailyStats[date].totalTime += prep.duration;
            }
        });
        // Calculate average for each day and remove totalTime
        const finalDailyStats = {};
        Object.keys(dailyStats).forEach(date => {
            finalDailyStats[date] = {
                count: dailyStats[date].count,
                averageTime: dailyStats[date].count > 0
                    ? dailyStats[date].totalTime / dailyStats[date].count
                    : 0
            };
        });
        const trendsArray = Object.entries(finalDailyStats)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date));
        res.status(200).json({
            success: true,
            data: {
                period: { start: startDate, end: endDate, days: period },
                summary: {
                    totalPreparations,
                    averagePrepTime: Math.round(averagePrepTime * 100) / 100,
                    efficiency: calculateEfficiency(prepTimes),
                },
                itemCountStats,
                dailyTrends: trendsArray,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPreparationStats = getPreparationStats;
// Helper functions
function estimatePrepTime(order) {
    // Base preparation time per item
    const baseTimePerItem = 3; // 3 minutes per item
    const itemCount = order.items.length;
    // Complexity factor based on item types
    const complexityFactor = order.items.some((item) => item.menuItem.nameEn?.toLowerCase().includes('coffee') ||
        item.menuItem.nameEn?.toLowerCase().includes('espresso')) ? 1.5 : 1.0;
    // Rush order factor
    const rushFactor = order.isRush ? 0.8 : 1.0;
    return Math.round(baseTimePerItem * itemCount * complexityFactor * rushFactor);
}
function getPriorityLevel(order) {
    if (order.isRush)
        return 100;
    if (order.priority === 'URGENT')
        return 90;
    if (order.priority === 'HIGH')
        return 80;
    if (order.priority === 'LOW')
        return 20;
    return 50; // NORMAL
}
function calculateAveragePrepTime(orders) {
    const completedPreps = orders.filter(o => o.preparationTime.length > 0 &&
        o.preparationTime[0].duration);
    if (completedPreps.length === 0)
        return 0;
    const totalTime = completedPreps.reduce((sum, order) => sum + order.preparationTime[0].duration, 0);
    return Math.round(totalTime / completedPreps.length);
}
function calculateEfficiency(prepTimes) {
    // Calculate efficiency based on how close actual times are to estimated times
    const efficiencyScores = prepTimes.map(prep => {
        const estimated = estimatePrepTime(prep.order);
        const actual = prep.duration || 0;
        if (estimated === 0)
            return 0;
        // Efficiency is higher when actual time is close to estimated time
        const ratio = actual / estimated;
        if (ratio <= 1.2 && ratio >= 0.8)
            return 100; // Within 20% of estimate
        if (ratio <= 1.5 && ratio >= 0.5)
            return 80; // Within 50% of estimate
        return Math.max(0, 100 - Math.abs(ratio - 1) * 50); // Penalize deviations
    });
    return efficiencyScores.length > 0
        ? Math.round(efficiencyScores.reduce((a, b) => a + b, 0) / efficiencyScores.length)
        : 0;
}
//# sourceMappingURL=preparation-time.controller.js.map