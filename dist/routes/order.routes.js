"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', order_controller_1.getAllOrders);
router.get('/:id', order_controller_1.getOrderById);
router.get('/:id/receipt', auth_middleware_1.requireBarista, order_controller_1.printReceipt);
router.post('/', auth_middleware_1.requireCaptain, (0, validation_middleware_1.validate)(order_controller_1.createOrderValidation), order_controller_1.createOrder);
// Allow CASHIER to update order status
router.patch('/:id/status', (req, res, next) => {
    console.log('🔄🔄🔄 PATCH /:id/status route hit!', {
        id: req.params.id,
        body: req.body,
        method: req.method,
        url: req.url,
        user: req.user
    });
    next();
}, auth_middleware_1.requireBarista, order_controller_1.updateOrderStatus);
router.post('/:id/items', auth_middleware_1.requireCaptain, (0, validation_middleware_1.validate)(order_controller_1.addItemsToOrderValidation), order_controller_1.addItemsToOrder);
router.patch('/:orderId/items/:itemId', auth_middleware_1.requireCaptain, (0, validation_middleware_1.validate)(order_controller_1.updateOrderItemValidation), order_controller_1.updateOrderItem);
router.delete('/:orderId/items/:itemId', auth_middleware_1.requireCaptain, order_controller_1.deleteOrderItem);
router.delete('/:id', auth_middleware_1.requireCaptain, order_controller_1.deleteOrder);
exports.default = router;
//# sourceMappingURL=order.routes.js.map