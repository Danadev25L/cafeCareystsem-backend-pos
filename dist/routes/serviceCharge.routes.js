"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const serviceCharge_controller_1 = require("../controllers/serviceCharge.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, serviceCharge_controller_1.getServiceChargeSettings);
router.get('/preview', serviceCharge_controller_1.previewServiceCharge); // Public endpoint for preview
router.put('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, (0, validation_middleware_1.validate)(serviceCharge_controller_1.updateServiceChargeSettingsValidation), serviceCharge_controller_1.updateServiceChargeSettings);
exports.default = router;
//# sourceMappingURL=serviceCharge.routes.js.map