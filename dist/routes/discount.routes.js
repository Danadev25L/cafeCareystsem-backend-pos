"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const discount_controller_1 = require("../controllers/discount.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, discount_controller_1.getDiscountSettings);
router.get('/preview', discount_controller_1.previewDiscount); // Public endpoint for preview
router.put('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, (0, validation_middleware_1.validate)(discount_controller_1.updateDiscountSettingsValidation), discount_controller_1.updateDiscountSettings);
exports.default = router;
//# sourceMappingURL=discount.routes.js.map