import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { Role } from '../types';
import {
  startPreparation,
  completePreparation,
  getKitchenQueue,
  getPreparationStats
} from '../controllers/preparation-time.controller';

const router = Router();

// Simple authorization middleware since authorize function doesn't exist yet
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

// Kitchen operations
router.post('/orders/:orderId/start-prep', authenticate, authorize([Role.CASHIER, Role.CAPTAIN]), startPreparation);
router.post('/orders/:orderId/complete-prep', authenticate, authorize([Role.CASHIER, Role.CAPTAIN]), completePreparation);
router.get('/queue', authenticate, authorize([Role.CASHIER, Role.CAPTAIN, Role.ADMIN]), getKitchenQueue);
router.get('/stats', authenticate, authorize([Role.CASHIER, Role.CAPTAIN, Role.ADMIN]), getPreparationStats);

export default router;