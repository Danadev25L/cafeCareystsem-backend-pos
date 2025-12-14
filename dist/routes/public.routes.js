"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../utils/db");
const quality_control_controller_1 = require("../controllers/quality-control.controller");
const router = (0, express_1.Router)();
// Public menu routes (no authentication required)
router.get('/menu/categories', async (req, res, next) => {
    try {
        const categories = await db_1.prisma.menuCategory.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                menuItems: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        res.json({
            success: true,
            data: { categories },
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/menu/items', async (req, res, next) => {
    try {
        const { categoryId } = req.query;
        const where = {};
        if (categoryId) {
            where.categoryId = parseInt(categoryId, 10);
        }
        const menuItems = await db_1.prisma.menuItem.findMany({
            where,
            include: {
                category: {
                    select: {
                        id: true,
                        titleEn: true,
                        titleKu: true,
                        titleAr: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({
            success: true,
            data: { menuItems },
        });
    }
    catch (error) {
        next(error);
    }
});
// Public feedback endpoint (no authentication required)
router.post('/feedback', async (req, res, next) => {
    try {
        // Call the createFeedback controller but without orderId requirement
        await (0, quality_control_controller_1.createFeedback)(req, res, next);
    }
    catch (error) {
        next(error);
    }
});
// Public discount settings endpoint (no authentication required)
router.get('/discount-settings', async (req, res, next) => {
    try {
        let settings = await db_1.prisma.discountSettings.findFirst({
            where: { isActive: true },
            orderBy: { updatedAt: 'desc' },
        });
        // If no settings exist, return null
        if (!settings) {
            res.json({
                success: true,
                data: { settings: null },
            });
            return;
        }
        res.json({
            success: true,
            data: { settings },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=public.routes.js.map