"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewServiceCharge = exports.updateServiceChargeSettings = exports.updateServiceChargeSettingsValidation = exports.getServiceChargeSettings = void 0;
const express_validator_1 = require("express-validator");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getServiceChargeSettings = async (req, res, next) => {
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
    }
    catch (error) {
        next(error);
    }
};
exports.getServiceChargeSettings = getServiceChargeSettings;
exports.updateServiceChargeSettingsValidation = [
    (0, express_validator_1.body)('threshold')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('threshold must be a positive number'),
    (0, express_validator_1.body)('isPercentage')
        .optional()
        .isBoolean()
        .withMessage('isPercentage must be a boolean'),
    (0, express_validator_1.body)('percentageValue')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('percentageValue must be between 0 and 100'),
    (0, express_validator_1.body)('chargeAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('chargeAmount must be a positive number'),
    (0, express_validator_1.body)('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
];
const updateServiceChargeSettings = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
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
    }
    catch (error) {
        next(error);
    }
};
exports.updateServiceChargeSettings = updateServiceChargeSettings;
const previewServiceCharge = async (req, res, next) => {
    try {
        const { subtotal } = req.query;
        const subtotalValue = parseFloat(subtotal);
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
            }
            else if (!settings.isPercentage && settings.chargeAmount) {
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
    }
    catch (error) {
        next(error);
    }
};
exports.previewServiceCharge = previewServiceCharge;
//# sourceMappingURL=serviceCharge.controller.js.map