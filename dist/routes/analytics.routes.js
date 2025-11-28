"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const analytics_controller_1 = require("../controllers/analytics.controller");
const router = (0, express_1.Router)();
// Get analytics data
router.get('/', auth_middleware_1.authenticate, analytics_controller_1.getAnalytics);
router.get('/report', auth_middleware_1.authenticate, analytics_controller_1.getDetailedReport);
router.get('/revenue', auth_middleware_1.authenticate, analytics_controller_1.getRevenue);
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map