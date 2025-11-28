"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const router = (0, express_1.Router)();
router.post('/register', (0, validation_middleware_1.validate)(auth_controller_1.registerValidation), auth_controller_1.register);
router.post('/login', (0, validation_middleware_1.validate)(auth_controller_1.loginValidation), auth_controller_1.login);
router.post('/refresh-token', auth_controller_1.refreshToken);
router.get('/profile', auth_middleware_1.authenticate, auth_controller_1.getProfile);
router.put('/profile', auth_middleware_1.authenticate, auth_controller_1.updateProfile);
router.put('/change-password', auth_middleware_1.authenticate, auth_controller_1.changePassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map