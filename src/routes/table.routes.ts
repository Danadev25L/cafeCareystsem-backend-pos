import { Router } from 'express';
import {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  createTableValidation,
  updateTableValidation,
} from '../controllers/table.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAllTables);
router.get('/:id', getTableById);
router.post('/', requireAdmin, validate(createTableValidation), createTable);
router.put('/:id', requireAdmin, validate(updateTableValidation), updateTable);
router.delete('/:id', requireAdmin, deleteTable);

export default router;

