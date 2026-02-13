import { Router } from 'express';
import {
  getDiscountSettings,
  updateDiscountSettings,
  updateDiscountSettingsValidation,
  previewDiscount,
} from '../controllers/discount.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.get('/', authenticate, getDiscountSettings);
router.get('/preview', previewDiscount); // Public endpoint for preview
router.put('/', authenticate, requireAdmin, validate(updateDiscountSettingsValidation), updateDiscountSettings);

export default router;


