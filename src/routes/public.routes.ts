import { Router } from 'express';
import { prisma } from '../utils/db';
import { Response, NextFunction, Request } from 'express';
import { createFeedback } from '../controllers/quality-control.controller';

const router = Router();

// Public menu routes (no authentication required)
router.get('/menu/categories', async (req, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.menuCategory.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        menuItems: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/menu/items', async (req, res: Response, next: NextFunction) => {
  try {
    const { categoryId } = req.query;
    const where: any = {};
    
    if (categoryId) {
      where.categoryId = parseInt(categoryId as string, 10);
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            titleEn: true,
            titleKu: true,
            titleAr: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { menuItems },
    });
  } catch (error) {
    next(error);
  }
});

// Public feedback endpoint (no authentication required)
router.post('/feedback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Call the createFeedback controller but without orderId requirement
    await createFeedback(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Public discount settings endpoint (no authentication required)
router.get('/discount-settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let settings = await prisma.discountSettings.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    // If no settings exist, return null
    if (!settings) {
      res.json({
        success: true,
        data: { settings: null },
      });
      return;
    }

    res.json({
      success: true,
      data: { settings },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

