"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printReceipt = exports.deleteOrder = exports.deleteOrderItem = exports.updateOrderItem = exports.updateOrderItemValidation = exports.addItemsToOrder = exports.addItemsToOrderValidation = exports.updateOrderStatus = exports.getOrderById = exports.getAllOrders = exports.createOrder = exports.createOrderValidation = void 0;
const express_validator_1 = require("express-validator");
const db_1 = require("../utils/db");
const errors_1 = require("../utils/errors");
const types_1 = require("../types");
const socket_1 = require("../utils/socket");
exports.createOrderValidation = [
    (0, express_validator_1.body)('tableId')
        .isInt({ min: 1 })
        .withMessage('Table ID must be a positive integer'),
    (0, express_validator_1.body)('items')
        .isArray({ min: 1 })
        .withMessage('Order must have at least one item'),
    (0, express_validator_1.body)('items.*.menuItemId')
        .isInt({ min: 1 })
        .withMessage('Each item must have a valid menu item ID'),
    (0, express_validator_1.body)('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Each item must have a quantity of at least 1'),
    (0, express_validator_1.body)('items.*.price')
        .isFloat({ min: 0 })
        .withMessage('Each item must have a valid price'),
    (0, express_validator_1.body)('subtotal')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Subtotal must be a valid number'),
    (0, express_validator_1.body)('serviceCharge')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Service charge must be a valid number'),
    (0, express_validator_1.body)('total')
        .isFloat({ min: 0 })
        .withMessage('Total must be a valid number'),
];
const createOrder = async (req, res, next) => {
    try {
        console.log('📦 Creating order - Request body:', JSON.stringify(req.body, null, 2));
        const { tableId, items, subtotal, serviceCharge, total, priority = 'NORMAL', isRush = false } = req.body;
        if (!tableId) {
            console.error('❌ Missing tableId in request');
            throw new errors_1.ValidationError('Table ID is required');
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            console.error('❌ Invalid or empty items array');
            throw new errors_1.ValidationError('Order must have at least one item');
        }
        console.log('📦 Order items:', items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price
        })));
        // Verify table exists
        const table = await db_1.prisma.table.findUnique({
            where: { id: tableId },
        });
        if (!table) {
            console.error('❌ Table not found:', tableId);
            throw new errors_1.NotFoundError('Table not found');
        }
        console.log('✅ Table found:', { id: table.id, number: table.number, name: table.name });
        // Verify all menu items exist
        const menuItemIds = items.map((item) => item.menuItemId);
        const existingMenuItems = await db_1.prisma.menuItem.findMany({
            where: { id: { in: menuItemIds } },
            select: { id: true, nameEn: true }
        });
        if (existingMenuItems.length !== menuItemIds.length) {
            const foundIds = existingMenuItems.map(item => item.id);
            const missingIds = menuItemIds.filter((id) => !foundIds.includes(id));
            console.error('❌ Some menu items not found:', missingIds);
            throw new errors_1.NotFoundError(`Menu items not found: ${missingIds.join(', ')}`);
        }
        console.log('✅ All menu items verified');
        // Calculate subtotal and total if not provided
        let calculatedSubtotal = subtotal;
        let calculatedTotal = total;
        if (!calculatedSubtotal) {
            calculatedSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        }
        const serviceChargeValue = serviceCharge || 0;
        if (!calculatedTotal) {
            calculatedTotal = calculatedSubtotal + serviceChargeValue;
        }
        // Create order with items
        console.log('📦 Creating order in database...');
        const order = await db_1.prisma.order.create({
            data: {
                tableId,
                subtotal: calculatedSubtotal,
                serviceCharge: serviceChargeValue,
                total: calculatedTotal,
                status: types_1.OrderStatus.PENDING,
                priority,
                isRush,
                items: {
                    create: items.map((item) => ({
                        menuItemId: item.menuItemId,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                },
            },
            include: {
                table: {
                    select: {
                        id: true,
                        number: true,
                        name: true,
                    },
                },
                items: {
                    include: {
                        menuItem: {
                            select: {
                                id: true,
                                nameEn: true,
                                nameKu: true,
                                nameAr: true,
                                descriptionEn: true,
                                descriptionKu: true,
                                descriptionAr: true,
                                price: true,
                                image: true,
                            },
                        },
                    },
                },
            },
        });
        console.log('✅ Order created successfully:', { orderId: order.id, tableId: order.tableId, total: order.total });
        // Emit WebSocket event for real-time updates
        (0, socket_1.emitOrderCreated)(order);
        res.status(201).json({
            success: true,
            data: { order },
            message: 'Order created successfully',
        });
    }
    catch (error) {
        console.error('❌ Error creating order:', error);
        console.error('❌ Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : undefined,
        });
        next(error);
    }
};
exports.createOrder = createOrder;
const getAllOrders = async (req, res, next) => {
    try {
        const { status, tableId, date, page = 1, limit = 12, search } = req.query;
        const pageNum = parseInt(page, 10);
        let limitNum = Math.min(parseInt(limit, 10), 999); // Maximum 999 items
        const skip = (pageNum - 1) * limitNum;
        const baseConditions = {};
        // Base conditions (status, tableId, date)
        if (status) {
            baseConditions.status = status;
        }
        else {
            // By default, only show non-COMPLETED orders for main orders view
            baseConditions.status = {
                in: [types_1.OrderStatus.PENDING, types_1.OrderStatus.PREPARING, types_1.OrderStatus.READY]
            };
        }
        if (tableId) {
            const tableIdNum = parseInt(tableId, 10);
            if (!isNaN(tableIdNum)) {
                baseConditions.tableId = tableIdNum;
            }
        }
        // Filter by date if provided (format: YYYY-MM-DD)
        // For COMPLETED orders: Filter by updatedAt date (when they were completed)
        // For other statuses: Filter by createdAt date
        const dateStr = date;
        let dateFilterCondition = null;
        if (dateStr && dateStr !== '' && dateStr !== 'undefined' && dateStr !== 'null') {
            const filterDate = dateStr;
            const [year, month, day] = filterDate.split('-').map(Number);
            // Create date range that covers the full local day in Iraq timezone (UTC+3)
            // Iraq is UTC+3, so we need to adjust the UTC date range accordingly
            // When user selects Nov 24, we want orders from Nov 24 00:00:00 to Nov 24 23:59:59 in Iraq time
            // In UTC, that's Nov 23 21:00:00 to Nov 24 20:59:59
            // Create the start of the selected day in Iraq timezone (UTC+3)
            // Iraq time: YYYY-MM-DD 00:00:00
            // UTC time: YYYY-MM-DD 00:00:00 - 3 hours = previous day 21:00:00
            const iraqStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            // Subtract 3 hours to convert from Iraq time to UTC
            const startDate = new Date(iraqStart.getTime() - 3 * 60 * 60 * 1000);
            // Create the end of the selected day in Iraq timezone (UTC+3)
            // Iraq time: YYYY-MM-DD 23:59:59.999
            // UTC time: YYYY-MM-DD 23:59:59.999 - 3 hours = same day 20:59:59.999
            const iraqEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
            // Subtract 3 hours to convert from Iraq time to UTC
            const endDate = new Date(iraqEnd.getTime() - 3 * 60 * 60 * 1000);
            console.log(`📅 Date filter: ${filterDate} -> UTC range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                // For COMPLETED orders, filter by updatedAt (when completed)
                // For other statuses, filter by createdAt (when created)
                if (status === types_1.OrderStatus.COMPLETED) {
                    baseConditions.updatedAt = {
                        gte: startDate,
                        lte: endDate,
                    };
                }
                else {
                    baseConditions.createdAt = {
                        gte: startDate,
                        lte: endDate,
                    };
                }
            }
        }
        // Search functionality - search by order number (ID) primarily
        let where = {};
        if (search) {
            const searchStr = search.trim();
            if (!searchStr) {
                // Empty search, just use base conditions
                where = baseConditions;
            }
            else {
                const searchConditions = [];
                // Primary search: Order ID (order number) - exact match if it's a number
                const searchId = parseInt(searchStr, 10);
                if (!isNaN(searchId) && searchStr === searchId.toString()) {
                    // Exact match for order number
                    searchConditions.push({
                        id: { equals: searchId }
                    });
                }
                // Also search by table number and name
                // Convert search string to number for table number comparison
                const searchNumber = parseInt(searchStr, 10);
                searchConditions.push({
                    table: {
                        OR: [
                            ...(searchNumber && !isNaN(searchNumber) ? [{ number: { equals: searchNumber } }] : []),
                            { name: { contains: searchStr, mode: 'insensitive' } }
                        ]
                    }
                });
                // Combine base conditions with search and date filter using AND
                const andConditions = [];
                // Add base conditions (status, tableId, createdAt for non-completed)
                if (Object.keys(baseConditions).length > 0) {
                    andConditions.push(baseConditions);
                }
                // Add date filter for completed orders (if exists)
                if (dateFilterCondition) {
                    andConditions.push(dateFilterCondition);
                }
                // Add search conditions
                andConditions.push({ OR: searchConditions });
                where = {
                    AND: andConditions
                };
            }
        }
        else {
            // No search, combine base conditions with date filter if needed
            if (dateFilterCondition) {
                where = {
                    AND: [
                        baseConditions,
                        dateFilterCondition
                    ]
                };
            }
            else {
                where = baseConditions;
            }
        }
        // For COMPLETED orders, verify the query works
        if (status === types_1.OrderStatus.COMPLETED) {
            console.log('🔍 Fetching COMPLETED orders');
            console.log('🔍 Where clause:', JSON.stringify(where, null, 2));
            // Check total orders in database (any status)
            const totalOrders = await db_1.prisma.order.count();
            console.log('🔍 Total orders in DB (any status):', totalOrders);
            // Check orders by status
            const statusCounts = await Promise.all([
                db_1.prisma.order.count({ where: { status: types_1.OrderStatus.PENDING } }),
                db_1.prisma.order.count({ where: { status: types_1.OrderStatus.PREPARING } }),
                db_1.prisma.order.count({ where: { status: types_1.OrderStatus.READY } }),
                db_1.prisma.order.count({ where: { status: types_1.OrderStatus.COMPLETED } }),
                db_1.prisma.order.count({ where: { status: types_1.OrderStatus.CANCELLED } }),
            ]);
            console.log('🔍 Orders by status:', {
                PENDING: statusCounts[0],
                PREPARING: statusCounts[1],
                READY: statusCounts[2],
                COMPLETED: statusCounts[3],
                CANCELLED: statusCounts[4],
            });
            // Get a sample of all orders
            const allOrders = await db_1.prisma.order.findMany({
                select: {
                    id: true,
                    status: true,
                    updatedAt: true,
                    createdAt: true,
                },
                take: 10,
                orderBy: { updatedAt: 'desc' }
            });
            console.log('🔍 Sample of all orders (last 10):', allOrders.map((o) => ({
                id: o.id,
                status: o.status,
                updatedAt: o.updatedAt.toISOString(),
                createdAt: o.createdAt.toISOString()
            })));
        }
        // Get total count for pagination
        let total = await db_1.prisma.order.count({ where });
        console.log('🔍 Query result - Total count:', total, 'with where clause');
        let orders = await db_1.prisma.order.findMany({
            where,
            include: {
                table: {
                    select: {
                        id: true,
                        number: true,
                        name: true,
                    },
                },
                items: {
                    include: {
                        menuItem: {
                            select: {
                                id: true,
                                nameEn: true,
                                nameKu: true,
                                nameAr: true,
                                descriptionEn: true,
                                descriptionKu: true,
                                descriptionAr: true,
                                price: true,
                                image: true,
                            },
                        },
                    },
                    orderBy: {
                        id: 'asc',
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip,
            take: limitNum,
        });
        // Detailed logging for COMPLETED orders
        if (status === types_1.OrderStatus.COMPLETED) {
            console.log('✅ Query executed - Found', orders.length, 'COMPLETED orders (total count:', total, ')');
            if (orders.length > 0) {
                console.log('✅ Orders returned:', orders.map((o) => ({
                    id: o.id,
                    status: o.status,
                    tableNumber: o.table?.number,
                    updatedAt: o.updatedAt.toISOString()
                })));
            }
            else {
                console.log('⚠️ WARNING: Query returned 0 orders but total count is', total);
            }
        }
        const totalPages = Math.ceil(total / limitNum);
        // Final verification for COMPLETED orders before sending response
        if (status === types_1.OrderStatus.COMPLETED) {
            console.log('📤 SENDING RESPONSE:');
            console.log('  - Orders array length:', orders.length);
            console.log('  - Total items:', total);
            console.log('  - Orders IDs:', orders.map((o) => o.id));
            console.log('  - Response will have success: true');
            console.log('  - Response will have data.orders with', orders.length, 'items');
        }
        const response = {
            success: true,
            data: {
                orders,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limitNum,
                    hasNext: pageNum < totalPages,
                    hasPrev: pageNum > 1
                }
            },
        };
        if (status === types_1.OrderStatus.COMPLETED) {
            console.log('📤 ACTUAL RESPONSE BEING SENT:', JSON.stringify({
                success: response.success,
                dataOrdersLength: response.data.orders.length,
                totalItems: response.data.pagination.totalItems
            }));
        }
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllOrders = getAllOrders;
const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const orderId = parseInt(id, 10);
        if (isNaN(orderId)) {
            throw new errors_1.ValidationError('Invalid order ID');
        }
        const order = await db_1.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                table: {
                    select: {
                        id: true,
                        number: true,
                        name: true,
                    },
                },
                items: {
                    include: {
                        menuItem: {
                            select: {
                                id: true,
                                nameEn: true,
                                nameKu: true,
                                nameAr: true,
                                descriptionEn: true,
                                descriptionKu: true,
                                descriptionAr: true,
                                price: true,
                                image: true,
                            },
                        },
                    },
                },
            },
        });
        if (!order) {
            throw new errors_1.NotFoundError('Order not found');
        }
        res.json({
            success: true,
            data: { order },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getOrderById = getOrderById;
const updateOrderStatus = async (req, res, next) => {
    try {
        console.log('🔄🔄🔄 updateOrderStatus ENDPOINT HIT!');
        console.log('🔄 Request params:', req.params);
        console.log('🔄 Request body:', req.body);
        console.log('🔄 User:', req.user);
        const { id } = req.params;
        const orderId = parseInt(id, 10);
        const { status } = req.body;
        console.log('🔄 updateOrderStatus called:', { orderId, status });
        if (isNaN(orderId)) {
            throw new errors_1.ValidationError('Invalid order ID');
        }
        if (!Object.values(types_1.OrderStatus).includes(status)) {
            throw new errors_1.ValidationError('Invalid order status');
        }
        const order = await db_1.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!order) {
            console.log('❌ Order not found:', orderId);
            throw new errors_1.NotFoundError('Order not found');
        }
        console.log('📋 Current order status:', order.status, '-> Updating to:', status);
        // Check if order is being marked as READY
        const isMarkingReady = status === types_1.OrderStatus.READY;
        // Automatically set to COMPLETED when marked as READY
        const finalStatus = isMarkingReady ? types_1.OrderStatus.COMPLETED : status;
        const updatedOrder = await db_1.prisma.order.update({
            where: { id: orderId },
            data: { status: finalStatus },
            include: {
                table: {
                    select: {
                        id: true,
                        number: true,
                        name: true,
                    },
                },
                items: {
                    include: {
                        menuItem: {
                            select: {
                                id: true,
                                nameEn: true,
                                nameKu: true,
                                nameAr: true,
                                descriptionEn: true,
                                descriptionKu: true,
                                descriptionAr: true,
                                price: true,
                                image: true,
                            },
                        },
                    },
                },
            },
        });
        console.log('✅ Order updated successfully:', {
            orderId: updatedOrder.id,
            oldStatus: order.status,
            newStatus: updatedOrder.status,
            updatedAt: updatedOrder.updatedAt.toISOString(),
        });
        // Verify the update actually worked
        const verifyOrder = await db_1.prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, status: true, updatedAt: true }
        });
        console.log('🔍 Verification - Order in DB:', verifyOrder);
        // Debug logging for COMPLETED status updates
        if (status === types_1.OrderStatus.COMPLETED) {
            console.log('✅✅✅ Order marked as COMPLETED:', {
                orderId: updatedOrder.id,
                status: updatedOrder.status,
                updatedAt: updatedOrder.updatedAt.toISOString(),
                updatedAtDate: updatedOrder.updatedAt.toISOString().split('T')[0],
                createdAt: updatedOrder.createdAt.toISOString(),
                createdAtDate: updatedOrder.createdAt.toISOString().split('T')[0],
            });
            // Check if it's actually in the database as COMPLETED
            const checkCompleted = await db_1.prisma.order.count({
                where: { id: orderId, status: types_1.OrderStatus.COMPLETED }
            });
            console.log('🔍 Verification - Is order COMPLETED in DB?', checkCompleted === 1 ? 'YES ✅' : 'NO ❌');
        }
        // Emit WebSocket event for real-time updates
        (0, socket_1.emitOrderUpdated)(updatedOrder);
        // If order was marked as READY, emit special order:ready event for captain notification
        if (isMarkingReady) {
            // Create order object with READY status for the notification (even though DB has COMPLETED)
            const readyOrder = {
                ...updatedOrder,
                status: types_1.OrderStatus.READY, // Use READY status for the notification
            };
            (0, socket_1.emitOrderReady)(readyOrder);
            console.log('🔔 Emitted order:ready event for order:', orderId);
        }
        res.json({
            success: true,
            data: { order: updatedOrder },
            message: 'Order status updated successfully',
        });
    }
    catch (error) {
        console.error('❌ Error updating order status:', error);
        next(error);
    }
};
exports.updateOrderStatus = updateOrderStatus;
exports.addItemsToOrderValidation = [
    (0, express_validator_1.body)('items')
        .isArray({ min: 1 })
        .withMessage('Must provide at least one item'),
    (0, express_validator_1.body)('items.*.menuItemId')
        .isInt({ min: 1 })
        .withMessage('Each item must have a valid menu item ID'),
    (0, express_validator_1.body)('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Each item must have a quantity of at least 1'),
    (0, express_validator_1.body)('items.*.price')
        .isFloat({ min: 0 })
        .withMessage('Each item must have a valid price'),
];
const addItemsToOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const orderId = parseInt(id, 10);
        const { items } = req.body;
        if (isNaN(orderId)) {
            throw new errors_1.ValidationError('Invalid order ID');
        }
        const order = await db_1.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order) {
            throw new errors_1.NotFoundError('Order not found');
        }
        // Add new items
        await db_1.prisma.orderItem.createMany({
            data: items.map((item) => ({
                orderId,
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: item.price,
            })),
        });
        // Recalculate totals
        const allItems = await db_1.prisma.orderItem.findMany({
            where: { orderId },
        });
        const newSubtotal = allItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const newTotal = newSubtotal + order.serviceCharge;
        const updatedOrder = await db_1.prisma.order.update({
            where: { id: orderId },
            data: {
                subtotal: newSubtotal,
                total: newTotal,
            },
            include: {
                table: {
                    select: {
                        id: true,
                        number: true,
                        name: true,
                    },
                },
                items: {
                    include: {
                        menuItem: {
                            select: {
                                id: true,
                                nameEn: true,
                                nameKu: true,
                                nameAr: true,
                                descriptionEn: true,
                                descriptionKu: true,
                                descriptionAr: true,
                                price: true,
                                image: true,
                            },
                        },
                    },
                },
            },
        });
        // Emit WebSocket event for real-time updates
        (0, socket_1.emitOrderUpdated)(updatedOrder);
        res.json({
            success: true,
            data: { order: updatedOrder },
            message: 'Items added to order successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addItemsToOrder = addItemsToOrder;
exports.updateOrderItemValidation = [
    (0, express_validator_1.body)('quantity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),
    (0, express_validator_1.body)('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a valid number'),
];
const updateOrderItem = async (req, res, next) => {
    try {
        const { orderId, itemId } = req.params;
        const parsedOrderId = parseInt(orderId, 10);
        const parsedItemId = parseInt(itemId, 10);
        const { quantity, price } = req.body;
        if (isNaN(parsedOrderId) || isNaN(parsedItemId)) {
            throw new errors_1.ValidationError('Invalid order ID or item ID');
        }
        const orderItem = await db_1.prisma.orderItem.findUnique({
            where: { id: parsedItemId },
        });
        if (!orderItem || orderItem.orderId !== parsedOrderId) {
            throw new errors_1.NotFoundError('Order item not found');
        }
        const updateData = {};
        if (quantity !== undefined)
            updateData.quantity = quantity;
        if (price !== undefined)
            updateData.price = price;
        await db_1.prisma.orderItem.update({
            where: { id: parsedItemId },
            data: updateData,
        });
        // Recalculate totals
        const allItems = await db_1.prisma.orderItem.findMany({
            where: { orderId: parsedOrderId },
        });
        const order = await db_1.prisma.order.findUnique({
            where: { id: parsedOrderId },
        });
        if (!order) {
            throw new errors_1.NotFoundError('Order not found');
        }
        const newSubtotal = allItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const newTotal = newSubtotal + order.serviceCharge;
        const updatedOrder = await db_1.prisma.order.update({
            where: { id: parsedOrderId },
            data: {
                subtotal: newSubtotal,
                total: newTotal,
            },
            include: {
                table: {
                    select: {
                        id: true,
                        number: true,
                        name: true,
                    },
                },
                items: {
                    include: {
                        menuItem: {
                            select: {
                                id: true,
                                nameEn: true,
                                nameKu: true,
                                nameAr: true,
                                descriptionEn: true,
                                descriptionKu: true,
                                descriptionAr: true,
                                price: true,
                                image: true,
                            },
                        },
                    },
                    orderBy: {
                        id: 'asc',
                    },
                },
            },
        });
        // Emit WebSocket event for real-time updates
        (0, socket_1.emitOrderUpdated)(updatedOrder);
        res.json({
            success: true,
            data: { order: updatedOrder },
            message: 'Order item updated successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateOrderItem = updateOrderItem;
const deleteOrderItem = async (req, res, next) => {
    try {
        const { orderId, itemId } = req.params;
        const parsedOrderId = parseInt(orderId, 10);
        const parsedItemId = parseInt(itemId, 10);
        if (isNaN(parsedOrderId) || isNaN(parsedItemId)) {
            throw new errors_1.ValidationError('Invalid order ID or item ID');
        }
        const orderItem = await db_1.prisma.orderItem.findUnique({
            where: { id: parsedItemId },
        });
        if (!orderItem || orderItem.orderId !== parsedOrderId) {
            throw new errors_1.NotFoundError('Order item not found');
        }
        await db_1.prisma.orderItem.delete({
            where: { id: parsedItemId },
        });
        // Recalculate totals
        const allItems = await db_1.prisma.orderItem.findMany({
            where: { orderId: parsedOrderId },
        });
        const order = await db_1.prisma.order.findUnique({
            where: { id: parsedOrderId },
        });
        if (!order) {
            throw new errors_1.NotFoundError('Order not found');
        }
        const newSubtotal = allItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const newTotal = newSubtotal + order.serviceCharge;
        const updatedOrder = await db_1.prisma.order.update({
            where: { id: parsedOrderId },
            data: {
                subtotal: newSubtotal,
                total: newTotal,
            },
            include: {
                table: {
                    select: {
                        id: true,
                        number: true,
                        name: true,
                    },
                },
                items: {
                    include: {
                        menuItem: {
                            select: {
                                id: true,
                                nameEn: true,
                                nameKu: true,
                                nameAr: true,
                                descriptionEn: true,
                                descriptionKu: true,
                                descriptionAr: true,
                                price: true,
                                image: true,
                            },
                        },
                    },
                    orderBy: {
                        id: 'asc',
                    },
                },
            },
        });
        // Emit WebSocket event for real-time updates
        (0, socket_1.emitOrderUpdated)(updatedOrder);
        res.json({
            success: true,
            data: { order: updatedOrder },
            message: 'Order item deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteOrderItem = deleteOrderItem;
const deleteOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const orderId = parseInt(id, 10);
        if (isNaN(orderId)) {
            throw new errors_1.ValidationError('Invalid order ID');
        }
        const order = await db_1.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!order) {
            throw new errors_1.NotFoundError('Order not found');
        }
        // Delete order (cascade will delete order items)
        await db_1.prisma.order.delete({
            where: { id: orderId },
        });
        // Emit WebSocket event for real-time updates
        (0, socket_1.emitOrderDeleted)(orderId);
        res.json({
            success: true,
            message: 'Order deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteOrder = deleteOrder;
const printReceipt = async (req, res, next) => {
    try {
        const { id } = req.params;
        const orderId = parseInt(id, 10);
        if (isNaN(orderId)) {
            throw new errors_1.ValidationError('Invalid order ID');
        }
        const order = await db_1.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                table: {
                    select: {
                        id: true,
                        number: true,
                        name: true,
                    },
                },
                items: {
                    include: {
                        menuItem: {
                            select: {
                                id: true,
                                nameEn: true,
                                nameKu: true,
                                nameAr: true,
                                descriptionEn: true,
                                descriptionKu: true,
                                descriptionAr: true,
                                price: true,
                            },
                        },
                    },
                },
            },
        });
        if (!order) {
            throw new errors_1.NotFoundError('Order not found');
        }
        // Format receipt data for Xprinter (4 columns: Item Name | Quantity | Single Price | Total)
        const receipt = {
            orderId: order.id,
            tableNumber: order.table.number,
            tableName: order.table.name,
            date: order.createdAt.toISOString(),
            items: order.items.map((item) => ({
                name: item.menuItem.nameEn, // Default to English for receipts
                nameEn: item.menuItem.nameEn,
                nameKu: item.menuItem.nameKu,
                nameAr: item.menuItem.nameAr,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity,
            })),
            subtotal: order.subtotal,
            serviceCharge: order.serviceCharge,
            total: order.total,
            status: order.status,
        };
        // Set headers for receipt printing (codex printer format)
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Receipt-Type', 'codex');
        res.json({
            success: true,
            data: { receipt },
            message: 'Receipt data ready for printing',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.printReceipt = printReceipt;
//# sourceMappingURL=order.controller.js.map