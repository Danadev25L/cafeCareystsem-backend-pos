"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const types_1 = require("../types");
const order_modifications_controller_1 = require("../controllers/order-modifications.controller");
const router = (0, express_1.Router)();
// Simple authorization middleware
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: { message: 'Insufficient permissions' },
            });
        }
        next();
    };
};
// Order modifications
router.post('/:orderId/modify', auth_middleware_1.authenticate, authorize([types_1.Role.ADMIN, types_1.Role.CAPTAIN, types_1.Role.CASHIER]), order_modifications_controller_1.modifyOrder);
router.get('/:orderId/modifications', auth_middleware_1.authenticate, order_modifications_controller_1.getOrderModifications);
router.patch('/:orderId/cancel', auth_middleware_1.authenticate, authorize([types_1.Role.ADMIN, types_1.Role.CAPTAIN, types_1.Role.CASHIER]), order_modifications_controller_1.cancelOrder);
router.patch('/:orderId/priority', auth_middleware_1.authenticate, authorize([types_1.Role.ADMIN, types_1.Role.CAPTAIN, types_1.Role.CASHIER]), order_modifications_controller_1.setOrderPriority);
exports.default = router;
//# sourceMappingURL=order-modifications.routes.js.map