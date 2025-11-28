"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const common_controller_1 = require("../controllers/common.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/', auth_middleware_1.requireAdmin, common_controller_1.createUser);
router.get('/', common_controller_1.getAllUsers);
router.get('/:id', common_controller_1.getUserById);
router.put('/:id', common_controller_1.updateUser);
router.delete('/:id', auth_middleware_1.requireAdmin, common_controller_1.deleteUser);
exports.default = router;
//# sourceMappingURL=user.routes.js.map