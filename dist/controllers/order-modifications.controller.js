"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setOrderPriority = exports.cancelOrder = exports.getOrderModifications = exports.modifyOrder = void 0;
const db_1 = require("../utils/db");
const modifyOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { modificationType, reason, originalItemId, newQuantity } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'User not authenticated' },
            });
            return;
        }
        // Verify order exists and can be modified
        const order = await db_1.prisma.order.findUnique({
            where: { id: parseInt(orderId) },
            include: { items: true },
        });
        if (!order) {
            res.status(404).json({
                success: false,
                error: { message: 'Order not found' },
            });
            return;
        }
        if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
            res.status(400).json({
                success: false,
                error: { message: 'Cannot modify completed or cancelled orders' },
            });
            return;
        }
        // Handle different modification types
        let originalQuantity = 0;
        let modifiedOrder = null;
        switch (modificationType) {
            case 'ADD':
                const { menuItemId, quantity } = req.body;
                // Get menu item price
                const menuItem = await db_1.prisma.menuItem.findUnique({
                    where: { id: menuItemId },
                });
                if (!menuItem) {
                    res.status(404).json({
                        success: false,
                        error: { message: 'Menu item not found' },
                    });
                    return;
                }
                // Add new item to order
                await db_1.prisma.orderItem.create({
                    data: {
                        orderId: order.id,
                        menuItemId,
                        quantity,
                        price: menuItem.price,
                    },
                });
                // Update order totals
                modifiedOrder = await updateOrderTotals(order.id);
                break;
            case 'REMOVE': {
                const { itemId: removeItemId } = req.body;
                // Get original quantity before removal
                const itemToRemove = await db_1.prisma.orderItem.findUnique({
                    where: { id: removeItemId },
                });
                if (!itemToRemove) {
                    res.status(404).json({
                        success: false,
                        error: { message: 'Order item not found' },
                    });
                    return;
                }
                originalQuantity = itemToRemove.quantity;
                // Remove item from order
                await db_1.prisma.orderItem.delete({
                    where: { id: removeItemId },
                });
                // Update order totals
                modifiedOrder = await updateOrderTotals(order.id);
                break;
            }
            case 'MODIFY': {
                const { itemId: modifyItemId, newQuantity: qty } = req.body;
                // Get current item
                const currentItem = await db_1.prisma.orderItem.findUnique({
                    where: { id: modifyItemId },
                });
                if (!currentItem) {
                    res.status(404).json({
                        success: false,
                        error: { message: 'Order item not found' },
                    });
                    return;
                }
                originalQuantity = currentItem.quantity;
                if (qty <= 0) {
                    // Remove item if quantity is 0 or negative
                    await db_1.prisma.orderItem.delete({
                        where: { id: modifyItemId },
                    });
                }
                else {
                    // Update quantity
                    await db_1.prisma.orderItem.update({
                        where: { id: modifyItemId },
                        data: { quantity: qty },
                    });
                }
                // Update order totals
                modifiedOrder = await updateOrderTotals(order.id);
                break;
            }
            default:
                res.status(400).json({
                    success: false,
                    error: { message: 'Invalid modification type' },
                });
                return;
        }
        // Log the modification
        await db_1.prisma.orderModification.create({
            data: {
                orderId: order.id,
                originalItemId: req.body.itemId || null,
                originalQuantity,
                newQuantity: newQuantity || 0,
                modificationType,
                reason: reason || 'No reason provided',
                modifiedBy: userId,
            },
        });
        res.status(200).json({
            success: true,
            data: { order: modifiedOrder },
            message: 'Order modified successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.modifyOrder = modifyOrder;
const getOrderModifications = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const modifications = await db_1.prisma.orderModification.findMany({
            where: { orderId: parseInt(orderId) },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({
            success: true,
            data: { modifications },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getOrderModifications = getOrderModifications;
const cancelOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'User not authenticated' },
            });
            return;
        }
        const order = await db_1.prisma.order.findUnique({
            where: { id: parseInt(orderId) },
        });
        if (!order) {
            res.status(404).json({
                success: false,
                error: { message: 'Order not found' },
            });
            return;
        }
        if (order.status === 'COMPLETED') {
            res.status(400).json({
                success: false,
                error: { message: 'Cannot cancel completed orders' },
            });
            return;
        }
        if (order.status === 'CANCELLED') {
            res.status(400).json({
                success: false,
                error: { message: 'Order is already cancelled' },
            });
            return;
        }
        // Update order status
        const updatedOrder = await db_1.prisma.order.update({
            where: { id: parseInt(orderId) },
            data: { status: 'CANCELLED' },
        });
        // Log the cancellation
        await db_1.prisma.orderModification.create({
            data: {
                orderId: order.id,
                modificationType: 'CANCEL',
                reason: reason || 'Order cancelled',
                modifiedBy: userId,
            },
        });
        res.status(200).json({
            success: true,
            data: { order: updatedOrder },
            message: 'Order cancelled successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.cancelOrder = cancelOrder;
const setOrderPriority = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { priority, isRush } = req.body;
        const order = await db_1.prisma.order.findUnique({
            where: { id: parseInt(orderId) },
        });
        if (!order) {
            res.status(404).json({
                success: false,
                error: { message: 'Order not found' },
            });
            return;
        }
        const updatedOrder = await db_1.prisma.order.update({
            where: { id: parseInt(orderId) },
            data: {
                priority: priority || order.priority,
                isRush: isRush !== undefined ? isRush : order.isRush,
            },
        });
        res.status(200).json({
            success: true,
            data: { order: updatedOrder },
            message: 'Order priority updated successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.setOrderPriority = setOrderPriority;
// Helper function to update order totals
async function updateOrderTotals(orderId) {
    const order = await db_1.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
    });
    if (!order)
        return null;
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Get service charge settings
    const serviceSettings = await db_1.prisma.serviceChargeSettings.findFirst({
        where: { isActive: true },
    });
    let serviceCharge = 0;
    if (serviceSettings) {
        if (serviceSettings.isPercentage && serviceSettings.percentageValue) {
            serviceCharge = subtotal * (serviceSettings.percentageValue / 100);
        }
        else {
            serviceCharge = serviceSettings.chargeAmount;
        }
    }
    const total = subtotal + serviceCharge;
    return await db_1.prisma.order.update({
        where: { id: orderId },
        data: {
            subtotal,
            serviceCharge,
            total,
        },
        include: {
            items: {
                include: {
                    menuItem: true,
                },
            },
            table: true,
        },
    });
}
//# sourceMappingURL=order-modifications.controller.js.map