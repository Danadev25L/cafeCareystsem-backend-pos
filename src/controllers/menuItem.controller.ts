import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../utils/db';
import { ValidationError, NotFoundError } from '../utils/errors';
import { AuthRequest } from '../middlewares/auth.middleware';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary';

export const createMenuItemValidation = [
  body('nameEn')
    .trim()
    .notEmpty()
    .withMessage('Name (English) is required')
    .isLength({ max: 100 })
    .withMessage('Name (English) must be less than 100 characters'),
  body('nameKu')
    .trim()
    .notEmpty()
    .withMessage('Name (Kurdish) is required')
    .isLength({ max: 100 })
    .withMessage('Name (Kurdish) must be less than 100 characters'),
  body('nameAr')
    .trim()
    .notEmpty()
    .withMessage('Name (Arabic) is required')
    .isLength({ max: 100 })
    .withMessage('Name (Arabic) must be less than 100 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('categoryId')
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  body('descriptionEn')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description (English) must be less than 500 characters'),
  body('descriptionKu')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description (Kurdish) must be less than 500 characters'),
  body('descriptionAr')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description (Arabic) must be less than 500 characters'),
];

export const updateMenuItemValidation = [
  body('nameEn')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name (English) cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name (English) must be less than 100 characters'),
  body('nameKu')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name (Kurdish) cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name (Kurdish) must be less than 100 characters'),
  body('nameAr')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name (Arabic) cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name (Arabic) must be less than 100 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  body('descriptionEn')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description (English) must be less than 500 characters'),
  body('descriptionKu')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description (Kurdish) must be less than 500 characters'),
  body('descriptionAr')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description (Arabic) must be less than 500 characters'),
];

export const getAllMenuItems = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { categoryId } = req.query;
    
    const where = categoryId 
      ? { categoryId: parseInt(categoryId as string, 10) }
      : {};

    const menuItems = await prisma.menuItem.findMany({
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
  } catch (error) {
    next(error);
  }
};

export const getMenuItemById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const menuItemId = parseInt(id, 10);

    if (isNaN(menuItemId)) {
      throw new ValidationError('Invalid menu item ID');
    }

    const menuItem = await prisma.menuItem.findUnique({
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
      throw new NotFoundError('Menu item not found');
    }

    res.json({
      success: true,
      data: { menuItem },
    });
  } catch (error) {
    next(error);
  }
};

export const createMenuItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { nameEn, nameKu, nameAr, descriptionEn, descriptionKu, descriptionAr, price, categoryId } = req.body;
    let imageUrl: string | null = null;

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file, 'cafecare/menu-items');
      imageUrl = uploadResult.secure_url;
    }

    const category = await prisma.menuCategory.findUnique({
      where: { id: parseInt(categoryId, 10) },
    });

    if (!category) {
      throw new NotFoundError('Menu category not found');
    }

    const menuItem = await prisma.menuItem.create({
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
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const menuItemId = parseInt(id, 10);
    const { nameEn, nameKu, nameAr, descriptionEn, descriptionKu, descriptionAr, price, categoryId } = req.body;

    if (isNaN(menuItemId)) {
      throw new ValidationError('Invalid menu item ID');
    }

    const existingMenuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!existingMenuItem) {
      throw new NotFoundError('Menu item not found');
    }

    if (categoryId) {
      const category = await prisma.menuCategory.findUnique({
        where: { id: parseInt(categoryId, 10) },
      });

      if (!category) {
        throw new NotFoundError('Menu category not found');
      }
    }

    const updateData: {
      nameEn?: string;
      nameKu?: string;
      nameAr?: string;
      descriptionEn?: string | null;
      descriptionKu?: string | null;
      descriptionAr?: string | null;
      price?: number;
      image?: string | null;
      categoryId?: number;
    } = {};

    if (nameEn !== undefined) updateData.nameEn = nameEn;
    if (nameKu !== undefined) updateData.nameKu = nameKu;
    if (nameAr !== undefined) updateData.nameAr = nameAr;
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn || null;
    if (descriptionKu !== undefined) updateData.descriptionKu = descriptionKu || null;
    if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr || null;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (categoryId !== undefined) updateData.categoryId = parseInt(categoryId, 10);

    if (req.file) {
      if (existingMenuItem.image) {
        await deleteFromCloudinary(existingMenuItem.image);
      }
      const uploadResult = await uploadToCloudinary(req.file, 'cafecare/menu-items');
      updateData.image = uploadResult.secure_url;
    }

    const menuItem = await prisma.menuItem.update({
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
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const menuItemId = parseInt(id, 10);

    if (isNaN(menuItemId)) {
      throw new ValidationError('Invalid menu item ID');
    }

    const existingMenuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!existingMenuItem) {
      throw new NotFoundError('Menu item not found');
    }

    if (existingMenuItem.image) {
      await deleteFromCloudinary(existingMenuItem.image);
    }

    // Delete related OrderItems first to avoid foreign key constraint violation
    await prisma.orderItem.deleteMany({
      where: { menuItemId: menuItemId },
    });

    await prisma.menuItem.delete({
      where: { id: menuItemId },
    });

    res.json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

