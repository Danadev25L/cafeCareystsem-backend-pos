"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeedbackAnalytics = exports.getItemRatings = exports.getQualityMetrics = exports.reviewFeedback = exports.getFeedback = exports.createFeedback = void 0;
const db_1 = require("../utils/db");
const createFeedback = async (req, res, next) => {
    try {
        const orderId = req.params?.orderId;
        const { rating, comment, feedbackType, menuItemId, itemRatings } = req.body;
        // Validate rating (1-5)
        if (!rating || rating < 1 || rating > 5) {
            res.status(400).json({
                success: false,
                error: { message: 'Rating must be between 1 and 5' },
            });
            return;
        }
        // Validate feedback type
        const validTypes = ['QUALITY', 'SERVICE', 'AMBIANCE', 'OVERALL', 'ITEM'];
        if (!validTypes.includes(feedbackType)) {
            res.status(400).json({
                success: false,
                error: { message: 'Invalid feedback type' },
            });
            return;
        }
        // If orderId is provided, validate order
        if (orderId) {
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
            if (order.status !== 'COMPLETED') {
                res.status(400).json({
                    success: false,
                    error: { message: 'Feedback can only be provided for completed orders' },
                });
                return;
            }
            // Check if overall feedback already exists for this order
            const existingFeedback = await db_1.prisma.customerFeedback.findFirst({
                where: {
                    orderId: parseInt(orderId),
                    feedbackType: { in: ['QUALITY', 'SERVICE', 'AMBIANCE', 'OVERALL'] },
                },
            });
            if (existingFeedback && feedbackType !== 'ITEM') {
                res.status(400).json({
                    success: false,
                    error: { message: 'Feedback already exists for this order' },
                });
                return;
            }
        }
        // If menuItemId is provided, validate menu item
        if (menuItemId) {
            const menuItem = await db_1.prisma.menuItem.findUnique({
                where: { id: parseInt(menuItemId) },
            });
            if (!menuItem) {
                res.status(404).json({
                    success: false,
                    error: { message: 'Menu item not found' },
                });
                return;
            }
        }
        // Create overall feedback
        const feedback = await db_1.prisma.customerFeedback.create({
            data: {
                orderId: orderId ? parseInt(orderId) : null,
                menuItemId: menuItemId ? parseInt(menuItemId) : null,
                rating,
                comment,
                feedbackType,
            },
        });
        // If itemRatings array is provided, create feedback for each item
        const itemFeedbacks = [];
        if (itemRatings && Array.isArray(itemRatings)) {
            for (const itemRating of itemRatings) {
                if (itemRating.menuItemId && itemRating.rating >= 1 && itemRating.rating <= 5) {
                    // Validate menu item exists
                    const menuItem = await db_1.prisma.menuItem.findUnique({
                        where: { id: parseInt(itemRating.menuItemId) },
                    });
                    if (!menuItem) {
                        res.status(404).json({
                            success: false,
                            error: { message: `Menu item with ID ${itemRating.menuItemId} not found` },
                        });
                        return;
                    }
                    const itemFeedback = await db_1.prisma.customerFeedback.create({
                        data: {
                            orderId: orderId ? parseInt(orderId) : null,
                            menuItemId: parseInt(itemRating.menuItemId),
                            rating: itemRating.rating,
                            comment: itemRating.comment || null,
                            feedbackType: 'ITEM',
                        },
                    });
                    itemFeedbacks.push(itemFeedback);
                }
            }
        }
        res.status(201).json({
            success: true,
            data: {
                feedback,
                itemFeedbacks: itemFeedbacks.length > 0 ? itemFeedbacks : undefined,
            },
            message: 'Feedback submitted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createFeedback = createFeedback;
const getFeedback = async (req, res, next) => {
    try {
        const { status, feedbackType, rating, page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (feedbackType) {
            where.feedbackType = feedbackType;
        }
        if (rating) {
            where.rating = parseInt(rating, 10);
        }
        const feedback = await db_1.prisma.customerFeedback.findMany({
            where,
            include: {
                order: {
                    include: {
                        table: true,
                        items: {
                            include: {
                                menuItem: true,
                            },
                        },
                    },
                },
                reviewer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
        });
        const total = await db_1.prisma.customerFeedback.count({ where });
        res.status(200).json({
            success: true,
            data: {
                feedback,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalItems: total,
                    itemsPerPage: limitNum,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getFeedback = getFeedback;
const reviewFeedback = async (req, res, next) => {
    try {
        const { feedbackId } = req.params;
        const { status, response, notes } = req.body;
        const reviewerId = req.user?.userId;
        if (!reviewerId) {
            res.status(401).json({
                success: false,
                error: { message: 'User not authenticated' },
            });
            return;
        }
        const validStatuses = ['REVIEWED', 'RESOLVED'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({
                success: false,
                error: { message: 'Invalid status' },
            });
            return;
        }
        const updateData = {
            status,
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
        };
        if (response !== undefined) {
            updateData.response = response;
        }
        // Store notes in the comment field or response field
        if (notes !== undefined) {
            updateData.response = notes;
        }
        const updatedFeedback = await db_1.prisma.customerFeedback.update({
            where: { id: parseInt(feedbackId) },
            data: updateData,
            include: {
                reviewer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        res.status(200).json({
            success: true,
            data: { feedback: updatedFeedback },
            message: 'Feedback reviewed successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.reviewFeedback = reviewFeedback;
const getQualityMetrics = async (req, res, next) => {
    try {
        const { period = '30d' } = req.query;
        let startDate;
        let endDate = new Date();
        switch (period) {
            case '7d':
                startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        // Get all feedback in period
        const feedback = await db_1.prisma.customerFeedback.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                order: {
                    select: {
                        table: {
                            select: {
                                number: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        // Calculate metrics
        const totalFeedback = feedback.length;
        const averageRating = totalFeedback > 0
            ? feedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback
            : 0;
        // Rating distribution
        const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
            rating,
            count: feedback.filter((f) => f.rating === rating).length,
            percentage: totalFeedback > 0
                ? (feedback.filter((f) => f.rating === rating).length / totalFeedback) * 100
                : 0,
        }));
        // Feedback type distribution - include all types including OVERALL
        const typeDistribution = ['QUALITY', 'SERVICE', 'AMBIANCE', 'OVERALL'].map(type => ({
            type,
            count: feedback.filter((f) => f.feedbackType === type).length,
            averageRating: feedback.filter((f) => f.feedbackType === type).length > 0
                ? feedback.filter((f) => f.feedbackType === type).reduce((sum, f) => sum + f.rating, 0) /
                    feedback.filter((f) => f.feedbackType === type).length
                : 0,
        })).filter(type => type.count > 0); // Only show types that have feedback
        // Status distribution
        const statusDistribution = ['PENDING', 'REVIEWED', 'RESOLVED'].map(status => ({
            status,
            count: feedback.filter((f) => f.status === status).length,
        }));
        // Recent trends (daily)
        const dailyTrends = {};
        feedback.forEach((f) => {
            const date = f.createdAt.toISOString().split('T')[0];
            if (!dailyTrends[date]) {
                dailyTrends[date] = { count: 0, averageRating: 0, totalRating: 0 };
            }
            dailyTrends[date].count += 1;
            dailyTrends[date].totalRating += f.rating;
        });
        // Calculate average rating for each day and remove totalRating
        const finalTrends = {};
        Object.keys(dailyTrends).forEach(date => {
            finalTrends[date] = {
                count: dailyTrends[date].count,
                averageRating: dailyTrends[date].totalRating / dailyTrends[date].count
            };
        });
        const trendsArray = Object.entries(finalTrends)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date));
        // Issues requiring attention (low ratings) - include all feedback types and handle null orders
        const issues = feedback
            .filter((f) => f.rating <= 2 &&
            f.status !== 'RESOLVED' &&
            f.feedbackType !== 'ITEM' // Exclude item-level feedback from issues list
        )
            .map((f) => ({
            id: f.id,
            rating: f.rating,
            comment: f.comment,
            response: f.response, // Include response/notes from backend
            feedbackType: f.feedbackType,
            createdAt: f.createdAt,
            status: f.status,
            order: f.order || null, // Handle null order for public feedback
        }));
        res.status(200).json({
            success: true,
            data: {
                period: { start: startDate, end: endDate, days: period },
                summary: {
                    totalFeedback,
                    averageRating: Math.round(averageRating * 100) / 100,
                    satisfactionRate: totalFeedback > 0
                        ? Math.round((feedback.filter((f) => f.rating >= 4).length / totalFeedback) * 100)
                        : 0,
                },
                ratingDistribution,
                typeDistribution,
                statusDistribution,
                dailyTrends: trendsArray,
                issues,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getQualityMetrics = getQualityMetrics;
const getItemRatings = async (req, res, next) => {
    try {
        const { period = '30d' } = req.query;
        let startDate;
        let endDate = new Date();
        switch (period) {
            case '7d':
                startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        // Get all item-level feedback in period
        const itemFeedback = await db_1.prisma.customerFeedback.findMany({
            where: {
                feedbackType: 'ITEM',
                menuItemId: { not: null },
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                menuItem: {
                    select: {
                        id: true,
                        nameEn: true,
                        nameKu: true,
                        nameAr: true,
                    },
                },
            },
        });
        // Group by menu item
        const itemRatingsMap = {};
        itemFeedback.forEach((feedback) => {
            if (feedback.menuItem) {
                const itemId = feedback.menuItem.id;
                if (!itemRatingsMap[itemId]) {
                    itemRatingsMap[itemId] = {
                        menuItem: feedback.menuItem,
                        ratings: [],
                        comments: [],
                        totalRatings: 0,
                        averageRating: 0,
                    };
                }
                itemRatingsMap[itemId].ratings.push(feedback.rating);
                itemRatingsMap[itemId].totalRatings += 1;
                if (feedback.comment) {
                    itemRatingsMap[itemId].comments.push(feedback.comment);
                }
            }
        });
        // Calculate averages
        const itemRatings = Object.values(itemRatingsMap).map(item => ({
            ...item,
            averageRating: item.ratings.length > 0
                ? item.ratings.reduce((sum, r) => sum + r, 0) / item.ratings.length
                : 0,
        })).sort((a, b) => b.averageRating - a.averageRating);
        res.status(200).json({
            success: true,
            data: {
                period: { start: startDate, end: endDate, days: period },
                itemRatings,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getItemRatings = getItemRatings;
const getFeedbackAnalytics = async (req, res, next) => {
    try {
        // Get overall feedback analytics
        const totalFeedback = await db_1.prisma.customerFeedback.count();
        const completedOrders = await db_1.prisma.order.count({
            where: { status: 'COMPLETED' },
        });
        const feedbackRate = completedOrders > 0 ? (totalFeedback / completedOrders) * 100 : 0;
        // Get average ratings by category
        const qualityFeedback = await db_1.prisma.customerFeedback.aggregate({
            where: { feedbackType: 'QUALITY' },
            _avg: { rating: true },
            _count: { rating: true },
        });
        const serviceFeedback = await db_1.prisma.customerFeedback.aggregate({
            where: { feedbackType: 'SERVICE' },
            _avg: { rating: true },
            _count: { rating: true },
        });
        const ambianceFeedback = await db_1.prisma.customerFeedback.aggregate({
            where: { feedbackType: 'AMBIANCE' },
            _avg: { rating: true },
            _count: { rating: true },
        });
        // Get recent improvement areas
        const recentIssues = await db_1.prisma.customerFeedback.findMany({
            where: {
                rating: { lte: 2 },
                status: 'PENDING',
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
            },
            include: {
                order: {
                    include: {
                        table: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalFeedback,
                    completedOrders,
                    feedbackRate: Math.round(feedbackRate * 100) / 100,
                },
                categoryPerformance: [
                    {
                        type: 'QUALITY',
                        averageRating: qualityFeedback._avg.rating || 0,
                        count: qualityFeedback._count.rating,
                    },
                    {
                        type: 'SERVICE',
                        averageRating: serviceFeedback._avg.rating || 0,
                        count: serviceFeedback._count.rating,
                    },
                    {
                        type: 'AMBIANCE',
                        averageRating: ambianceFeedback._avg.rating || 0,
                        count: ambianceFeedback._count.rating,
                    },
                ],
                recentIssues,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getFeedbackAnalytics = getFeedbackAnalytics;
//# sourceMappingURL=quality-control.controller.js.map