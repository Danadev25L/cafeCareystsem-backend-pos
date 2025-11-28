"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTable = exports.updateTable = exports.createTable = exports.getTableById = exports.getAllTables = exports.updateTableValidation = exports.createTableValidation = void 0;
const express_validator_1 = require("express-validator");
const db_1 = require("../utils/db");
const errors_1 = require("../utils/errors");
exports.createTableValidation = [
    (0, express_validator_1.body)('number')
        .isInt({ min: 1 })
        .withMessage('Table number must be a positive integer'),
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Name must be less than 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
];
exports.updateTableValidation = [
    (0, express_validator_1.body)('number')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Table number must be a positive integer'),
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Name must be less than 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
];
const getAllTables = async (req, res, next) => {
    try {
        const tables = await db_1.prisma.table.findMany({
            orderBy: { number: 'asc' },
            select: {
                id: true,
                number: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                orders: {
                    where: {
                        status: 'PENDING',
                    },
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                },
            },
        });
        // Transform tables to include hasActiveOrder flag
        const tablesWithStatus = tables.map((table) => ({
            id: table.id,
            number: table.number,
            name: table.name,
            description: table.description,
            createdAt: table.createdAt,
            updatedAt: table.updatedAt,
            hasActiveOrder: table.orders.length > 0,
            activeOrderStatus: table.orders.length > 0 ? table.orders[0].status : null,
            activeOrderId: table.orders.length > 0 ? table.orders[0].id : null,
        }));
        res.json({
            success: true,
            data: { tables: tablesWithStatus },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllTables = getAllTables;
const getTableById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const tableId = parseInt(id, 10);
        if (isNaN(tableId)) {
            throw new errors_1.ValidationError('Invalid table ID');
        }
        const table = await db_1.prisma.table.findUnique({
            where: { id: tableId },
            select: {
                id: true,
                number: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!table) {
            throw new errors_1.NotFoundError('Table not found');
        }
        res.json({
            success: true,
            data: { table },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTableById = getTableById;
const createTable = async (req, res, next) => {
    try {
        const { number, name, description } = req.body;
        const existingTable = await db_1.prisma.table.findFirst({
            where: { number },
        });
        if (existingTable) {
            throw new errors_1.ConflictError('Table with this number already exists');
        }
        const table = await db_1.prisma.table.create({
            data: {
                number,
                name: name || null,
                description: description || null,
            },
            select: {
                id: true,
                number: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.status(201).json({
            success: true,
            data: { table },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createTable = createTable;
const updateTable = async (req, res, next) => {
    try {
        const { id } = req.params;
        const tableId = parseInt(id, 10);
        const { number, name, description } = req.body;
        if (isNaN(tableId)) {
            throw new errors_1.ValidationError('Invalid table ID');
        }
        const existingTable = await db_1.prisma.table.findUnique({
            where: { id: tableId },
        });
        if (!existingTable) {
            throw new errors_1.NotFoundError('Table not found');
        }
        if (number && number !== existingTable.number) {
            const duplicateTable = await db_1.prisma.table.findFirst({
                where: { number, id: { not: tableId } },
            });
            if (duplicateTable) {
                throw new errors_1.ConflictError('Table with this number already exists');
            }
        }
        const updateData = {};
        if (number !== undefined)
            updateData.number = number;
        if (name !== undefined)
            updateData.name = name || null;
        if (description !== undefined)
            updateData.description = description || null;
        const table = await db_1.prisma.table.update({
            where: { id: tableId },
            data: updateData,
            select: {
                id: true,
                number: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.json({
            success: true,
            data: { table },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTable = updateTable;
const deleteTable = async (req, res, next) => {
    try {
        const { id } = req.params;
        const tableId = parseInt(id, 10);
        if (isNaN(tableId)) {
            throw new errors_1.ValidationError('Invalid table ID');
        }
        const existingTable = await db_1.prisma.table.findUnique({
            where: { id: tableId },
        });
        if (!existingTable) {
            throw new errors_1.NotFoundError('Table not found');
        }
        await db_1.prisma.table.delete({
            where: { id: tableId },
        });
        res.json({
            success: true,
            message: 'Table deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTable = deleteTable;
//# sourceMappingURL=table.controller.js.map