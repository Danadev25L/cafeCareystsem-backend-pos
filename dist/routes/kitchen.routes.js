"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const types_1 = require("../types");
const preparation_time_controller_1 = require("../controllers/preparation-time.controller");
const router = (0, express_1.Router)();
// Simple authorization middleware since authorize function doesn't exist yet
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
// Kitchen operations
router.post('/orders/:orderId/start-prep', auth_middleware_1.authenticate, authorize([types_1.Role.CASHIER, types_1.Role.CAPTAIN]), preparation_time_controller_1.startPreparation);
router.post('/orders/:orderId/complete-prep', auth_middleware_1.authenticate, authorize([types_1.Role.CASHIER, types_1.Role.CAPTAIN]), preparation_time_controller_1.completePreparation);
router.get('/queue', auth_middleware_1.authenticate, authorize([types_1.Role.CASHIER, types_1.Role.CAPTAIN, types_1.Role.ADMIN]), preparation_time_controller_1.getKitchenQueue);
router.get('/stats', auth_middleware_1.authenticate, authorize([types_1.Role.CASHIER, types_1.Role.CAPTAIN, types_1.Role.ADMIN]), preparation_time_controller_1.getPreparationStats);
exports.default = router;
//# sourceMappingURL=kitchen.routes.js.map