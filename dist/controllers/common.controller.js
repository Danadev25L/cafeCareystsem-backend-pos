"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUserById = exports.getAllUsers = exports.createUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../utils/db");
const errors_1 = require("../utils/errors");
const types_1 = require("../types");
const createUser = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.ForbiddenError('Authentication required');
        }
        if (req.user.role !== types_1.Role.ADMIN) {
            throw new errors_1.ForbiddenError('Only admins can create users');
        }
        const { email, password, name, role, isActive } = req.body;
        if (!email || !password) {
            throw new errors_1.ValidationError('Email and password are required');
        }
        if (password.length < 8) {
            throw new errors_1.ValidationError('Password must be at least 8 characters');
        }
        if (!role || !['ADMIN', 'CAPTAIN', 'CASHIER'].includes(role)) {
            throw new errors_1.ValidationError('Valid role is required (ADMIN, CAPTAIN, or CASHIER)');
        }
        const existingUser = await db_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new errors_1.ConflictError('User with this email already exists');
        }
        const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
        const hashedPassword = await bcrypt_1.default.hash(password, bcryptRounds);
        const user = await db_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || null,
                role: role,
                isActive: isActive !== undefined ? isActive : true,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.status(201).json({
            success: true,
            data: { user },
            message: 'User created successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createUser = createUser;
const getAllUsers = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.ForbiddenError('Authentication required');
        }
        const { role, isActive, page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (role) {
            where.role = role;
        }
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }
        if (req.user.role !== types_1.Role.ADMIN) {
            where.id = req.user.userId;
        }
        const [users, total] = await Promise.all([
            db_1.prisma.user.findMany({
                where,
                skip,
                take: limitNum,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    isActive: true,
                    lastLogin: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            db_1.prisma.user.count({ where }),
        ]);
        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.ForbiddenError('Authentication required');
        }
        const userId = parseInt(req.params.id, 10);
        if (req.user.role !== types_1.Role.ADMIN && req.user.userId !== userId) {
            throw new errors_1.ForbiddenError('You can only view your own profile');
        }
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        res.json({
            success: true,
            data: { user },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserById = getUserById;
const updateUser = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.ForbiddenError('Authentication required');
        }
        const userId = parseInt(req.params.id, 10);
        const { name, role, isActive } = req.body;
        if (req.user.role !== types_1.Role.ADMIN && req.user.userId !== userId) {
            throw new errors_1.ForbiddenError('You can only update your own profile');
        }
        if (role && req.user.role !== types_1.Role.ADMIN) {
            throw new errors_1.ForbiddenError('Only admins can change roles');
        }
        if (isActive !== undefined && req.user.role !== types_1.Role.ADMIN) {
            throw new errors_1.ForbiddenError('Only admins can change user status');
        }
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        const updatedUser = await db_1.prisma.user.update({
            where: { id: userId },
            data: {
                ...(name !== undefined && { name }),
                ...(role && req.user.role === types_1.Role.ADMIN && { role }),
                ...(isActive !== undefined && req.user.role === types_1.Role.ADMIN && { isActive }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                updatedAt: true,
            },
        });
        res.json({
            success: true,
            data: { user: updatedUser },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.ForbiddenError('Authentication required');
        }
        if (req.user.role !== types_1.Role.ADMIN) {
            throw new errors_1.ForbiddenError('Only admins can delete users');
        }
        const userId = parseInt(req.params.id, 10);
        if (req.user.userId === userId) {
            throw new errors_1.ForbiddenError('You cannot delete your own account');
        }
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        await db_1.prisma.user.delete({
            where: { id: userId },
        });
        res.json({
            success: true,
            message: 'User deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=common.controller.js.map