import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

export const getServiceChargeSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let settings = await prisma.serviceChargeSettings.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.serviceChargeSettings.create({
        data: {
          isPercentage: true,
          percentageValue: 0,
          chargeAmount: 0,
          isActive: true,
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

export const updateServiceChargeSettingsValidation = [
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
  body('chargeAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('chargeAmount must be a positive number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const updateServiceChargeSettings = async (
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

    const { threshold, isPercentage, percentageValue, chargeAmount, isActive } = req.body;

    // Get existing active settings or create new ones
    let settings = await prisma.serviceChargeSettings.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (settings) {
      // Deactivate old settings
      await prisma.serviceChargeSettings.update({
        where: { id: settings.id },
        data: { isActive: false },
      });
    }

    // Use existing values if not provided
    const existingThreshold = settings?.threshold || 10.0;
    const existingIsPercentage = settings?.isPercentage ?? true;
    const existingPercentageValue = settings?.percentageValue ?? 0;
    const existingChargeAmount = settings?.chargeAmount ?? 0;
    const existingIsActive = settings?.isActive ?? true;

    // Create new active settings
    settings = await prisma.serviceChargeSettings.create({
      data: {
        threshold: threshold !== undefined ? threshold : existingThreshold,
        isPercentage: isPercentage !== undefined ? isPercentage : existingIsPercentage,
        percentageValue: percentageValue !== undefined ? percentageValue : (existingIsPercentage ? existingPercentageValue : null),
        chargeAmount: chargeAmount !== undefined ? chargeAmount : (!existingIsPercentage ? existingChargeAmount : 0),
        isActive: isActive !== undefined ? isActive : existingIsActive,
      },
    });

    res.json({
      success: true,
      data: { settings },
      message: 'Service charge settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const previewServiceCharge = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subtotal } = req.query;
    const subtotalValue = parseFloat(subtotal as string);

    if (isNaN(subtotalValue) || subtotalValue < 0) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid subtotal value' },
      });
      return;
    }

    // Get active service charge settings
    let settings = await prisma.serviceChargeSettings.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!settings) {
      settings = await prisma.serviceChargeSettings.create({
        data: {
          threshold: 10000.0, // Default threshold: 10,000
          isPercentage: true,
          percentageValue: 0,
          chargeAmount: 0,
          isActive: true,
        },
      });
    }

    // Only show preview if subtotal is 5,000 or more
    const previewThreshold = 5000;
    const serviceChargeThreshold = settings.threshold || 10000;

    let serviceCharge = 0;
    let showPreview = subtotalValue >= previewThreshold;
    let belowThreshold = subtotalValue < serviceChargeThreshold;

    // Calculate service charge if subtotal is at or above threshold
    if (subtotalValue >= serviceChargeThreshold) {
      if (settings.isPercentage && settings.percentageValue) {
        serviceCharge = (subtotalValue * settings.percentageValue) / 100;
      } else if (!settings.isPercentage && settings.chargeAmount) {
        serviceCharge = settings.chargeAmount;
      }
    }

    const total = subtotalValue + serviceCharge;

    res.json({
      success: true,
      data: {
        subtotal: subtotalValue,
        serviceCharge,
        total,
        threshold: serviceChargeThreshold,
        belowThreshold,
        showPreview,
        settings: {
          isPercentage: settings.isPercentage,
          percentageValue: settings.percentageValue,
          chargeAmount: settings.chargeAmount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

