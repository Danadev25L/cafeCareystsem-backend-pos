import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

export const getDiscountSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let settings = await prisma.discountSettings.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.discountSettings.create({
        data: {
          isPercentage: true,
          percentageValue: 0,
          discountAmount: 0,
          isActive: true,
          isAllItems: true,
        },
      });
    }

    res.json({
      success: true,
      data: { settings },
    });
  } catch (error) {
    next(error);
  }
};

export const updateDiscountSettingsValidation = [
  body('threshold')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('threshold must be a positive number'),
  body('isPercentage')
    .optional()
    .isBoolean()
    .withMessage('isPercentage must be a boolean'),
  body('percentageValue')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('percentageValue must be between 0 and 100'),
  body('discountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('discountAmount must be a positive number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('isAllItems')
    .optional()
    .isBoolean()
    .withMessage('isAllItems must be a boolean'),
  body('menuItemIds')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined) {
        return true; // Allow null or undefined
      }
      return Array.isArray(value);
    })
    .withMessage('menuItemIds must be an array or null'),
  body('specificDates')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined) {
        return true; // Allow null or undefined
      }
      return Array.isArray(value);
    })
    .withMessage('specificDates must be an array or null'),
  body('startDate')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null, undefined, or empty string
      }
      // Check if it's a valid ISO 8601 date
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .withMessage('startDate must be a valid ISO 8601 date'),
  body('endDate')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null, undefined, or empty string
      }
      // Check if it's a valid ISO 8601 date
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .withMessage('endDate must be a valid ISO 8601 date'),
];

export const updateDiscountSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array(),
        },
      });
      return;
    }

    const { 
      threshold, 
      isPercentage, 
      percentageValue, 
      discountAmount, 
      isActive,
      isAllItems,
      menuItemIds,
      specificDates,
      startDate,
      endDate
    } = req.body;

    // Get existing active settings
    let settings = await prisma.discountSettings.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (settings) {
      // Deactivate old settings
      await prisma.discountSettings.update({
        where: { id: settings.id },
        data: { isActive: false },
      });
    }

    // Use existing values if not provided
    const existingThreshold = settings?.threshold || 0.0;
    const existingIsPercentage = settings?.isPercentage ?? true;
    const existingPercentageValue = settings?.percentageValue ?? 0;
    const existingDiscountAmount = settings?.discountAmount ?? 0;
    const existingIsActive = settings?.isActive ?? true;
    const existingIsAllItems = settings?.isAllItems ?? true;
    const existingMenuItemIds = settings?.menuItemIds || null;
    const existingSpecificDates = settings?.specificDates || null;
    const existingStartDate = settings?.startDate || null;
    const existingEndDate = settings?.endDate || null;

    // Create new active settings
    settings = await prisma.discountSettings.create({
      data: {
        threshold: threshold !== undefined ? threshold : existingThreshold,
        isPercentage: isPercentage !== undefined ? isPercentage : existingIsPercentage,
        percentageValue: percentageValue !== undefined ? percentageValue : (existingIsPercentage ? existingPercentageValue : null),
        discountAmount: discountAmount !== undefined ? discountAmount : (!existingIsPercentage ? existingDiscountAmount : 0),
        isActive: isActive !== undefined ? isActive : existingIsActive,
        isAllItems: isAllItems !== undefined ? isAllItems : existingIsAllItems,
        menuItemIds: menuItemIds !== undefined ? menuItemIds : existingMenuItemIds,
        specificDates: specificDates !== undefined ? specificDates : existingSpecificDates,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : existingStartDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existingEndDate,
      },
    });

    res.json({
      success: true,
      data: { settings },
      message: 'Discount settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const previewDiscount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subtotal, menuItemIds } = req.query;
    const subtotalValue = parseFloat(subtotal as string);
    const itemIds = menuItemIds ? JSON.parse(menuItemIds as string) : [];

    if (isNaN(subtotalValue) || subtotalValue < 0) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid subtotal value' },
      });
      return;
    }

    // Get active discount settings
    let settings = await prisma.discountSettings.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!settings) {
      settings = await prisma.discountSettings.create({
        data: {
          threshold: 0.0,
          isPercentage: true,
          percentageValue: 0,
          discountAmount: 0,
          isActive: true,
          isAllItems: true,
        },
      });
    }

    // Check if discount applies based on dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let dateApplies = true;

    if (settings.specificDates && Array.isArray(settings.specificDates) && settings.specificDates.length > 0) {
      const dates = settings.specificDates as string[];
      const todayStr = today.toISOString().split('T')[0];
      dateApplies = dates.includes(todayStr);
    } else if (settings.startDate || settings.endDate) {
      const startDate = settings.startDate ? new Date(settings.startDate) : null;
      const endDate = settings.endDate ? new Date(settings.endDate) : null;
      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);
      dateApplies = (!startDate || today >= startDate) && (!endDate || today <= endDate);
    }

    // Check if discount applies to items
    let itemApplies = true;
    if (!settings.isAllItems && settings.menuItemIds && Array.isArray(settings.menuItemIds)) {
      const settingItemIds = settings.menuItemIds as number[];
      itemApplies = itemIds.length > 0 && itemIds.some((id: number) => settingItemIds.includes(id));
    }

    const discountThreshold = settings.threshold || 0;
    const belowThreshold = subtotalValue < discountThreshold;

    let discount = 0;
    const shouldApply = dateApplies && itemApplies && !belowThreshold && settings.isActive;

    // Calculate discount if conditions are met
    if (shouldApply) {
      if (settings.isPercentage && settings.percentageValue) {
        discount = (subtotalValue * settings.percentageValue) / 100;
      } else if (!settings.isPercentage && settings.discountAmount) {
        discount = settings.discountAmount;
      }
    }

    const total = subtotalValue - discount;

    res.json({
      success: true,
      data: {
        subtotal: subtotalValue,
        discount,
        total,
        threshold: discountThreshold,
        belowThreshold,
        dateApplies,
        itemApplies,
        shouldApply,
        settings: {
          isPercentage: settings.isPercentage,
          percentageValue: settings.percentageValue,
          discountAmount: settings.discountAmount,
          isAllItems: settings.isAllItems,
          menuItemIds: settings.menuItemIds,
          specificDates: settings.specificDates,
          startDate: settings.startDate,
          endDate: settings.endDate,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

