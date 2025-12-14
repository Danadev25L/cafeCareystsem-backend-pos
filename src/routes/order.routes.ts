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
import { authenticate, requireCaptain, requireBarista, AuthRequest, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { Role } from '../types';

const router = Router();

router.use(authenticate);

router.get('/', getAllOrders);
router.get('/:id', getOrderById);
router.get('/:id/receipt', requireBarista, printReceipt);
// Allow CASHIER and CAPTAIN to create orders (for sales and table orders)
router.post('/', authorize(Role.CASHIER, Role.CAPTAIN, Role.ADMIN), validate(createOrderValidation), createOrder);
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
// Allow CASHIER, CAPTAIN, and ADMIN to edit orders (add, update, delete items)
router.post('/:id/items', authorize(Role.CASHIER, Role.CAPTAIN, Role.ADMIN), validate(addItemsToOrderValidation), addItemsToOrder);
router.patch('/:orderId/items/:itemId', authorize(Role.CASHIER, Role.CAPTAIN, Role.ADMIN), validate(updateOrderItemValidation), updateOrderItem);
router.delete('/:orderId/items/:itemId', authorize(Role.CASHIER, Role.CAPTAIN, Role.ADMIN), deleteOrderItem);
router.delete('/:id', requireCaptain, deleteOrder);

export default router;

