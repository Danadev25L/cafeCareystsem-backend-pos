import { Router } from 'express';
import {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createMenuItemValidation,
  updateMenuItemValidation,
} from '../controllers/menuItem.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAllMenuItems);
router.get('/:id', getMenuItemById);
router.post('/', requireAdmin, uploadSingle('image'), validate(createMenuItemValidation), createMenuItem);
router.put('/:id', requireAdmin, uploadSingle('image'), validate(updateMenuItemValidation), updateMenuItem);
router.delete('/:id', requireAdmin, deleteMenuItem);

export default router;

