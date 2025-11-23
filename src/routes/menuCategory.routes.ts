import { Router } from 'express';
import {
  getAllMenuCategories,
  getMenuCategoryById,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  createMenuCategoryValidation,
  updateMenuCategoryValidation,
} from '../controllers/menuCategory.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAllMenuCategories);
router.get('/:id', getMenuCategoryById);
router.post('/', requireAdmin, uploadSingle('image'), validate(createMenuCategoryValidation), createMenuCategory);
router.put('/:id', requireAdmin, uploadSingle('image'), validate(updateMenuCategoryValidation), updateMenuCategory);
router.delete('/:id', requireAdmin, deleteMenuCategory);

export default router;

