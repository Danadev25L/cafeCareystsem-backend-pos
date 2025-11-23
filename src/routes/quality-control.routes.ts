import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { Role } from '../types';
import {
  createFeedback,
  getFeedback,
  reviewFeedback,
  getQualityMetrics,
  getFeedbackAnalytics,
  getItemRatings
} from '../controllers/quality-control.controller';

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

// Feedback management
router.post('/orders/:orderId/feedback', createFeedback);
router.post('/feedback', createFeedback); // Public feedback endpoint (no order required)
router.get('/feedback', authenticate, authorize([Role.ADMIN, Role.CAPTAIN]), getFeedback);
router.patch('/feedback/:feedbackId/review', authenticate, authorize([Role.ADMIN, Role.CAPTAIN]), reviewFeedback);

// Quality metrics
router.get('/metrics', authenticate, authorize([Role.ADMIN, Role.CAPTAIN]), getQualityMetrics);
router.get('/analytics', authenticate, authorize([Role.ADMIN, Role.CAPTAIN]), getFeedbackAnalytics);
router.get('/item-ratings', authenticate, authorize([Role.ADMIN, Role.CAPTAIN]), getItemRatings);

export default router;