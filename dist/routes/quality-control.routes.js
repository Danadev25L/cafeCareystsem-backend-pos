"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const types_1 = require("../types");
const quality_control_controller_1 = require("../controllers/quality-control.controller");
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
// Feedback management
router.post('/orders/:orderId/feedback', quality_control_controller_1.createFeedback);
router.post('/feedback', quality_control_controller_1.createFeedback); // Public feedback endpoint (no order required)
router.get('/feedback', auth_middleware_1.authenticate, authorize([types_1.Role.ADMIN, types_1.Role.CAPTAIN]), quality_control_controller_1.getFeedback);
router.patch('/feedback/:feedbackId/review', auth_middleware_1.authenticate, authorize([types_1.Role.ADMIN, types_1.Role.CAPTAIN]), quality_control_controller_1.reviewFeedback);
// Quality metrics
router.get('/metrics', auth_middleware_1.authenticate, authorize([types_1.Role.ADMIN, types_1.Role.CAPTAIN]), quality_control_controller_1.getQualityMetrics);
router.get('/analytics', auth_middleware_1.authenticate, authorize([types_1.Role.ADMIN, types_1.Role.CAPTAIN]), quality_control_controller_1.getFeedbackAnalytics);
router.get('/item-ratings', auth_middleware_1.authenticate, authorize([types_1.Role.ADMIN, types_1.Role.CAPTAIN]), quality_control_controller_1.getItemRatings);
exports.default = router;
//# sourceMappingURL=quality-control.routes.js.map