import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../utils/db';
import { ValidationError, NotFoundError } from '../utils/errors';
import { AuthRequest } from '../middlewares/auth.middleware';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary';

export const createMenuCategoryValidation = [
  body('titleEn')
    .trim()
    .notEmpty()
    .withMessage('Title (English) is required')
    .isLength({ max: 100 })
    .withMessage('Title (English) must be less than 100 characters'),
  body('titleKu')
    .trim()
    .notEmpty()
    .withMessage('Title (Kurdish) is required')
    .isLength({ max: 100 })
    .withMessage('Title (Kurdish) must be less than 100 characters'),
  body('titleAr')
    .trim()
    .notEmpty()
    .withMessage('Title (Arabic) is required')
    .isLength({ max: 100 })
    .withMessage('Title (Arabic) must be less than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
];

export const updateMenuCategoryValidation = [
  body('titleEn')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title (English) cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Title (English) must be less than 100 characters'),
  body('titleKu')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title (Kurdish) cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Title (Kurdish) must be less than 100 characters'),
  body('titleAr')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title (Arabic) cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Title (Arabic) must be less than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
];

export const getAllMenuCategories = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await prisma.menuCategory.findMany({
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
  } catch (error) {
    next(error);
  }
};

export const getMenuCategoryById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id, 10);

    if (isNaN(categoryId)) {
      throw new ValidationError('Invalid category ID');
    }

    const category = await prisma.menuCategory.findUnique({
      where: { id: categoryId },
      include: {
        menuItems: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Menu category not found');
    }

    res.json({
      success: true,
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const createMenuCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { titleEn, titleKu, titleAr, description } = req.body;
    let imageUrl: string | null = null;

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file, 'cafecare/menu-categories');
      imageUrl = uploadResult.secure_url;
    }

    const category = await prisma.menuCategory.create({
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
  } catch (error) {
    next(error);
  }
};

export const updateMenuCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id, 10);
    const { titleEn, titleKu, titleAr, description } = req.body;

    if (isNaN(categoryId)) {
      throw new ValidationError('Invalid category ID');
    }

    const existingCategory = await prisma.menuCategory.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      throw new NotFoundError('Menu category not found');
    }

    const updateData: {
      titleEn?: string;
      titleKu?: string;
      titleAr?: string;
      image?: string | null;
      description?: string | null;
    } = {};

    if (titleEn !== undefined) updateData.titleEn = titleEn;
    if (titleKu !== undefined) updateData.titleKu = titleKu;
    if (titleAr !== undefined) updateData.titleAr = titleAr;
    if (description !== undefined) updateData.description = description || null;

    if (req.file) {
      if (existingCategory.image) {
        await deleteFromCloudinary(existingCategory.image);
      }
      const uploadResult = await uploadToCloudinary(req.file, 'cafecare/menu-categories');
      updateData.image = uploadResult.secure_url;
    }

    const category = await prisma.menuCategory.update({
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
  } catch (error) {
    next(error);
  }
};

export const deleteMenuCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id, 10);

    if (isNaN(categoryId)) {
      throw new ValidationError('Invalid category ID');
    }

    const existingCategory = await prisma.menuCategory.findUnique({
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
      throw new NotFoundError('Menu category not found');
    }

    // Delete category image from Cloudinary
    if (existingCategory.image) {
      await deleteFromCloudinary(existingCategory.image);
    }

    // Get all menu item IDs in this category
    const menuItemIds = existingCategory.menuItems.map(item => item.id);

    // Delete all OrderItems that reference MenuItems in this category
    // This must be done before deleting the menu items to avoid foreign key constraint violations
    if (menuItemIds.length > 0) {
      await prisma.orderItem.deleteMany({
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
        await deleteFromCloudinary(menuItem.image);
      }
    }

    // Delete all menu items in this category
    // This will cascade from the category, but we're doing it explicitly to ensure proper order
    if (menuItemIds.length > 0) {
      await prisma.menuItem.deleteMany({
        where: {
          categoryId: categoryId,
        },
      });
    }

    // Finally, delete the category
    await prisma.menuCategory.delete({
      where: { id: categoryId },
    });

    res.json({
      success: true,
      message: 'Menu category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

