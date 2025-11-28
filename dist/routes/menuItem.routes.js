"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const menuItem_controller_1 = require("../controllers/menuItem.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', menuItem_controller_1.getAllMenuItems);
router.get('/:id', menuItem_controller_1.getMenuItemById);
router.post('/', auth_middleware_1.requireAdmin, (0, upload_middleware_1.uploadSingle)('image'), (0, validation_middleware_1.validate)(menuItem_controller_1.createMenuItemValidation), menuItem_controller_1.createMenuItem);
router.put('/:id', auth_middleware_1.requireAdmin, (0, upload_middleware_1.uploadSingle)('image'), (0, validation_middleware_1.validate)(menuItem_controller_1.updateMenuItemValidation), menuItem_controller_1.updateMenuItem);
router.delete('/:id', auth_middleware_1.requireAdmin, menuItem_controller_1.deleteMenuItem);
exports.default = router;
//# sourceMappingURL=menuItem.routes.js.map