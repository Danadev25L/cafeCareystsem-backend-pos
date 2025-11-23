import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getAnalytics, getDetailedReport, getRevenue } from '../controllers/analytics.controller';

const router = Router();

// Get analytics data
router.get('/', authenticate, getAnalytics);
router.get('/report', authenticate, getDetailedReport);
router.get('/revenue', authenticate, getRevenue);

export default router;