import { Router } from 'express';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  addItemsToOrder,
  updateOrderItem,
  deleteOrderItem,
  deleteOrder,
  printReceipt,
  createOrderValidation,
  addItemsToOrderValidation,
  updateOrderItemValidation,
} from '../controllers/order.controller';
import { authenticate, requireCaptain, requireBarista, AuthRequest } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAllOrders);
router.get('/:id', getOrderById);
router.get('/:id/receipt', requireBarista, printReceipt);
router.post('/', requireCaptain, validate(createOrderValidation), createOrder);
// Allow CASHIER to update order status
router.patch('/:id/status', (req: AuthRequest, res, next) => {
  console.log('🔄🔄🔄 PATCH /:id/status route hit!', { 
    id: req.params.id, 
    body: req.body,
    method: req.method,
    url: req.url,
    user: req.user
  });
  next();
}, requireBarista, updateOrderStatus);
router.post('/:id/items', requireCaptain, validate(addItemsToOrderValidation), addItemsToOrder);
router.patch('/:orderId/items/:itemId', requireCaptain, validate(updateOrderItemValidation), updateOrderItem);
router.delete('/:orderId/items/:itemId', requireCaptain, deleteOrderItem);
router.delete('/:id', requireCaptain, deleteOrder);

export default router;

