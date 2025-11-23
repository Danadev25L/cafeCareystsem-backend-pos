"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const menuCategory_controller_1 = require("../controllers/menuCategory.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', menuCategory_controller_1.getAllMenuCategories);
router.get('/:id', menuCategory_controller_1.getMenuCategoryById);
router.post('/', auth_middleware_1.requireAdmin, (0, upload_middleware_1.uploadSingle)('image'), (0, validation_middleware_1.validate)(menuCategory_controller_1.createMenuCategoryValidation), menuCategory_controller_1.createMenuCategory);
router.put('/:id', auth_middleware_1.requireAdmin, (0, upload_middleware_1.uploadSingle)('image'), (0, validation_middleware_1.validate)(menuCategory_controller_1.updateMenuCategoryValidation), menuCategory_controller_1.updateMenuCategory);
router.delete('/:id', auth_middleware_1.requireAdmin, menuCategory_controller_1.deleteMenuCategory);
exports.default = router;
//# sourceMappingURL=menuCategory.routes.js.map