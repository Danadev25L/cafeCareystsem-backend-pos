"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMenuCategory = exports.updateMenuCategory = exports.createMenuCategory = exports.getMenuCategoryById = exports.getAllMenuCategories = exports.updateMenuCategoryValidation = exports.createMenuCategoryValidation = void 0;
const express_validator_1 = require("express-validator");
const db_1 = require("../utils/db");
const errors_1 = require("../utils/errors");
const cloudinary_1 = require("../utils/cloudinary");
exports.createMenuCategoryValidation = [
    (0, express_validator_1.body)('titleEn')
        .trim()
        .notEmpty()
        .withMessage('Title (English) is required')
        .isLength({ max: 100 })
        .withMessage('Title (English) must be less than 100 characters'),
    (0, express_validator_1.body)('titleKu')
        .trim()
        .notEmpty()
        .withMessage('Title (Kurdish) is required')
        .isLength({ max: 100 })
        .withMessage('Title (Kurdish) must be less than 100 characters'),
    (0, express_validator_1.body)('titleAr')
        .trim()
        .notEmpty()
        .withMessage('Title (Arabic) is required')
        .isLength({ max: 100 })
        .withMessage('Title (Arabic) must be less than 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
];
exports.updateMenuCategoryValidation = [
    (0, express_validator_1.body)('titleEn')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Title (English) cannot be empty')
        .isLength({ max: 100 })
        .withMessage('Title (English) must be less than 100 characters'),
    (0, express_validator_1.body)('titleKu')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Title (Kurdish) cannot be empty')
        .isLength({ max: 100 })
        .withMessage('Title (Kurdish) must be less than 100 characters'),
    (0, express_validator_1.body)('titleAr')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Title (Arabic) cannot be empty')
        .isLength({ max: 100 })
        .withMessage('Title (Arabic) must be less than 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
];
const getAllMenuCategories = async (req, res, next) => {
    try {
        const categories = await db_1.prisma.menuCategory.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                menuItems: {
                    select: {
                        id: true,
                    },
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
};
exports.getAllMenuCategories = getAllMenuCategories;
const getMenuCategoryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const categoryId = parseInt(id, 10);
        if (isNaN(categoryId)) {
            throw new errors_1.ValidationError('Invalid category ID');
        }
        const category = await db_1.prisma.menuCategory.findUnique({
            where: { id: categoryId },
            include: {
                menuItems: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!category) {
            throw new errors_1.NotFoundError('Menu category not found');
        }
        res.json({
            success: true,
            data: { category },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMenuCategoryById = getMenuCategoryById;
const createMenuCategory = async (req, res, next) => {
    try {
        const { titleEn, titleKu, titleAr, description } = req.body;
        let imageUrl = null;
        if (req.file) {
            const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(req.file, 'cafecare/menu-categories');
            imageUrl = uploadResult.secure_url;
        }
        const category = await db_1.prisma.menuCategory.create({
            data: {
                titleEn,
                titleKu,
                titleAr,
                image: imageUrl,
                description: description || null,
            },
            include: {
                menuItems: {
                    select: {
                        id: true,
                    },
                },
            },
        });
        res.status(201).json({
            success: true,
            data: { category },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createMenuCategory = createMenuCategory;
const updateMenuCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const categoryId = parseInt(id, 10);
        const { titleEn, titleKu, titleAr, description } = req.body;
        if (isNaN(categoryId)) {
            throw new errors_1.ValidationError('Invalid category ID');
        }
        const existingCategory = await db_1.prisma.menuCategory.findUnique({
            where: { id: categoryId },
        });
        if (!existingCategory) {
            throw new errors_1.NotFoundError('Menu category not found');
        }
        const updateData = {};
        if (titleEn !== undefined)
            updateData.titleEn = titleEn;
        if (titleKu !== undefined)
            updateData.titleKu = titleKu;
        if (titleAr !== undefined)
            updateData.titleAr = titleAr;
        if (description !== undefined)
            updateData.description = description || null;
        if (req.file) {
            if (existingCategory.image) {
                await (0, cloudinary_1.deleteFromCloudinary)(existingCategory.image);
            }
            const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(req.file, 'cafecare/menu-categories');
            updateData.image = uploadResult.secure_url;
        }
        const category = await db_1.prisma.menuCategory.update({
            where: { id: categoryId },
            data: updateData,
            include: {
                menuItems: {
                    select: {
                        id: true,
                    },
                },
            },
        });
        res.json({
            success: true,
            data: { category },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateMenuCategory = updateMenuCategory;
const deleteMenuCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const categoryId = parseInt(id, 10);
        if (isNaN(categoryId)) {
            throw new errors_1.ValidationError('Invalid category ID');
        }
        const existingCategory = await db_1.prisma.menuCategory.findUnique({
            where: { id: categoryId },
            include: {
                menuItems: {
                    select: {
                        id: true,
                        image: true,
                    },
                },
            },
        });
        if (!existingCategory) {
            throw new errors_1.NotFoundError('Menu category not found');
        }
        // Delete category image from Cloudinary
        if (existingCategory.image) {
            await (0, cloudinary_1.deleteFromCloudinary)(existingCategory.image);
        }
        // Get all menu item IDs in this category
        const menuItemIds = existingCategory.menuItems.map(item => item.id);
        // Delete all OrderItems that reference MenuItems in this category
        // This must be done before deleting the menu items to avoid foreign key constraint violations
        if (menuItemIds.length > 0) {
            await db_1.prisma.orderItem.deleteMany({
                where: {
                    menuItemId: {
                        in: menuItemIds,
                    },
                },
            });
        }
        // Delete menu item images from Cloudinary
        for (const menuItem of existingCategory.menuItems) {
            if (menuItem.image) {
                await (0, cloudinary_1.deleteFromCloudinary)(menuItem.image);
            }
        }
        // Delete all menu items in this category
        // This will cascade from the category, but we're doing it explicitly to ensure proper order
        if (menuItemIds.length > 0) {
            await db_1.prisma.menuItem.deleteMany({
                where: {
                    categoryId: categoryId,
                },
            });
        }
        // Finally, delete the category
        await db_1.prisma.menuCategory.delete({
            where: { id: categoryId },
        });
        res.json({
            success: true,
            message: 'Menu category deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteMenuCategory = deleteMenuCategory;
//# sourceMappingURL=menuCategory.controller.js.map