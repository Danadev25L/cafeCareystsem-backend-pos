import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { Role } from '../types';
import { modifyOrder, getOrderModifications, cancelOrder, setOrderPriority } from '../controllers/order-modifications.controller';

const router = Router();

// Simple authorization middleware
const authorize = (roles: Role[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role as Role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions' },
      });
    }
    next();
  };
};

// Order modifications
router.post('/:orderId/modify', authenticate, authorize([Role.ADMIN, Role.CAPTAIN, Role.CASHIER]), modifyOrder);
router.get('/:orderId/modifications', authenticate, getOrderModifications);
router.patch('/:orderId/cancel', authenticate, authorize([Role.ADMIN, Role.CAPTAIN, Role.CASHIER]), cancelOrder);
router.patch('/:orderId/priority', authenticate, authorize([Role.ADMIN, Role.CAPTAIN, Role.CASHIER]), setOrderPriority);

export default router;