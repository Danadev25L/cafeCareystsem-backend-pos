import { Router } from 'express';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/common.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', requireAdmin, createUser);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', requireAdmin, deleteUser);

export default router;

