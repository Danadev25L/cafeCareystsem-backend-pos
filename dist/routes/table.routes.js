"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const table_controller_1 = require("../controllers/table.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', table_controller_1.getAllTables);
router.get('/:id', table_controller_1.getTableById);
router.post('/', auth_middleware_1.requireAdmin, (0, validation_middleware_1.validate)(table_controller_1.createTableValidation), table_controller_1.createTable);
router.put('/:id', auth_middleware_1.requireAdmin, (0, validation_middleware_1.validate)(table_controller_1.updateTableValidation), table_controller_1.updateTable);
router.delete('/:id', auth_middleware_1.requireAdmin, table_controller_1.deleteTable);
exports.default = router;
//# sourceMappingURL=table.routes.js.map