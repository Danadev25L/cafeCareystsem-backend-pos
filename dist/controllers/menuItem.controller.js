"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMenuItem = exports.updateMenuItem = exports.createMenuItem = exports.getMenuItemById = exports.getAllMenuItems = exports.updateMenuItemValidation = exports.createMenuItemValidation = void 0;
const express_validator_1 = require("express-validator");
const db_1 = require("../utils/db");
const errors_1 = require("../utils/errors");
const cloudinary_1 = require("../utils/cloudinary");
exports.createMenuItemValidation = [
    (0, express_validator_1.body)('nameEn')
        .trim()
        .notEmpty()
        .withMessage('Name (English) is required')
        .isLength({ max: 100 })
        .withMessage('Name (English) must be less than 100 characters'),
    (0, express_validator_1.body)('nameKu')
        .trim()
        .notEmpty()
        .withMessage('Name (Kurdish) is required')
        .isLength({ max: 100 })
        .withMessage('Name (Kurdish) must be less than 100 characters'),
    (0, express_validator_1.body)('nameAr')
        .trim()
        .notEmpty()
        .withMessage('Name (Arabic) is required')
        .isLength({ max: 100 })
        .withMessage('Name (Arabic) must be less than 100 characters'),
    (0, express_validator_1.body)('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    (0, express_validator_1.body)('categoryId')
        .isInt({ min: 1 })
        .withMessage('Category ID must be a positive integer'),
    (0, express_validator_1.body)('descriptionEn')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description (English) must be less than 500 characters'),
    (0, express_validator_1.body)('descriptionKu')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description (Kurdish) must be less than 500 characters'),
    (0, express_validator_1.body)('descriptionAr')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description (Arabic) must be less than 500 characters'),
];
exports.updateMenuItemValidation = [
    (0, express_validator_1.body)('nameEn')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Name (English) cannot be empty')
        .isLength({ max: 100 })
        .withMessage('Name (English) must be less than 100 characters'),
    (0, express_validator_1.body)('nameKu')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Name (Kurdish) cannot be empty')
        .isLength({ max: 100 })
        .withMessage('Name (Kurdish) must be less than 100 characters'),
    (0, express_validator_1.body)('nameAr')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Name (Arabic) cannot be empty')
        .isLength({ max: 100 })
        .withMessage('Name (Arabic) must be less than 100 characters'),
    (0, express_validator_1.body)('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    (0, express_validator_1.body)('categoryId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Category ID must be a positive integer'),
    (0, express_validator_1.body)('descriptionEn')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description (English) must be less than 500 characters'),
    (0, express_validator_1.body)('descriptionKu')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description (Kurdish) must be less than 500 characters'),
    (0, express_validator_1.body)('descriptionAr')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description (Arabic) must be less than 500 characters'),
];
const getAllMenuItems = async (req, res, next) => {
    try {
        const { categoryId } = req.query;
        const where = categoryId
            ? { categoryId: parseInt(categoryId, 10) }
            : {};
        const menuItems = await db_1.prisma.menuItem.findMany({
            where,
            orderBy: { createdAt: 'desc' },
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
        });
        res.json({
            success: true,
            data: { menuItems },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllMenuItems = getAllMenuItems;
const getMenuItemById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const menuItemId = parseInt(id, 10);
        if (isNaN(menuItemId)) {
            throw new errors_1.ValidationError('Invalid menu item ID');
        }
        const menuItem = await db_1.prisma.menuItem.findUnique({
            where: { id: menuItemId },
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
        });
        if (!menuItem) {
            throw new errors_1.NotFoundError('Menu item not found');
        }
        res.json({
            success: true,
            data: { menuItem },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMenuItemById = getMenuItemById;
const createMenuItem = async (req, res, next) => {
    try {
        const { nameEn, nameKu, nameAr, descriptionEn, descriptionKu, descriptionAr, price, categoryId } = req.body;
        let imageUrl = null;
        if (req.file) {
            const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(req.file, 'cafecare/menu-items');
            imageUrl = uploadResult.secure_url;
        }
        const category = await db_1.prisma.menuCategory.findUnique({
            where: { id: parseInt(categoryId, 10) },
        });
        if (!category) {
            throw new errors_1.NotFoundError('Menu category not found');
        }
        const menuItem = await db_1.prisma.menuItem.create({
            data: {
                nameEn,
                nameKu,
                nameAr,
                descriptionEn: descriptionEn || null,
                descriptionKu: descriptionKu || null,
                descriptionAr: descriptionAr || null,
                price: parseFloat(price),
                image: imageUrl,
                categoryId: parseInt(categoryId, 10),
            },
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
        });
        res.status(201).json({
            success: true,
            data: { menuItem },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createMenuItem = createMenuItem;
const updateMenuItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const menuItemId = parseInt(id, 10);
        const { nameEn, nameKu, nameAr, descriptionEn, descriptionKu, descriptionAr, price, categoryId } = req.body;
        if (isNaN(menuItemId)) {
            throw new errors_1.ValidationError('Invalid menu item ID');
        }
        const existingMenuItem = await db_1.prisma.menuItem.findUnique({
            where: { id: menuItemId },
        });
        if (!existingMenuItem) {
            throw new errors_1.NotFoundError('Menu item not found');
        }
        if (categoryId) {
            const category = await db_1.prisma.menuCategory.findUnique({
                where: { id: parseInt(categoryId, 10) },
            });
            if (!category) {
                throw new errors_1.NotFoundError('Menu category not found');
            }
        }
        const updateData = {};
        if (nameEn !== undefined)
            updateData.nameEn = nameEn;
        if (nameKu !== undefined)
            updateData.nameKu = nameKu;
        if (nameAr !== undefined)
            updateData.nameAr = nameAr;
        if (descriptionEn !== undefined)
            updateData.descriptionEn = descriptionEn || null;
        if (descriptionKu !== undefined)
            updateData.descriptionKu = descriptionKu || null;
        if (descriptionAr !== undefined)
            updateData.descriptionAr = descriptionAr || null;
        if (price !== undefined)
            updateData.price = parseFloat(price);
        if (categoryId !== undefined)
            updateData.categoryId = parseInt(categoryId, 10);
        if (req.file) {
            if (existingMenuItem.image) {
                await (0, cloudinary_1.deleteFromCloudinary)(existingMenuItem.image);
            }
            const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(req.file, 'cafecare/menu-items');
            updateData.image = uploadResult.secure_url;
        }
        const menuItem = await db_1.prisma.menuItem.update({
            where: { id: menuItemId },
            data: updateData,
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
        });
        res.json({
            success: true,
            data: { menuItem },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateMenuItem = updateMenuItem;
const deleteMenuItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const menuItemId = parseInt(id, 10);
        if (isNaN(menuItemId)) {
            throw new errors_1.ValidationError('Invalid menu item ID');
        }
        const existingMenuItem = await db_1.prisma.menuItem.findUnique({
            where: { id: menuItemId },
        });
        if (!existingMenuItem) {
            throw new errors_1.NotFoundError('Menu item not found');
        }
        if (existingMenuItem.image) {
            await (0, cloudinary_1.deleteFromCloudinary)(existingMenuItem.image);
        }
        // Delete related OrderItems first to avoid foreign key constraint violation
        await db_1.prisma.orderItem.deleteMany({
            where: { menuItemId: menuItemId },
        });
        await db_1.prisma.menuItem.delete({
            where: { id: menuItemId },
        });
        res.json({
            success: true,
            message: 'Menu item deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteMenuItem = deleteMenuItem;
//# sourceMappingURL=menuItem.controller.js.map