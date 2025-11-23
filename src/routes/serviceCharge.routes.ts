import { Router } from 'express';
import {
  getServiceChargeSettings,
  updateServiceChargeSettings,
  updateServiceChargeSettingsValidation,
  previewServiceCharge,
} from '../controllers/serviceCharge.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.get('/', authenticate, getServiceChargeSettings);
router.get('/preview', previewServiceCharge); // Public endpoint for preview
router.put('/', authenticate, requireAdmin, validate(updateServiceChargeSettingsValidation), updateServiceChargeSettings);

export default router;

