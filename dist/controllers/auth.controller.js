"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateProfile = exports.getProfile = exports.refreshToken = exports.login = exports.register = exports.loginValidation = exports.registerValidation = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const express_validator_1 = require("express-validator");
const db_1 = require("../utils/db");
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const types_1 = require("../types");
exports.registerValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('role')
        .optional()
        .isIn(['ADMIN', 'CAPTAIN', 'CASHIER'])
        .withMessage('Invalid role'),
];
exports.loginValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required'),
];
const register = async (req, res, next) => {
    try {
        const { email, password, name, role } = req.body;
        const existingUser = await db_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new errors_1.ConflictError('User with this email already exists');
        }
        const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
        const hashedPassword = await bcrypt_1.default.hash(password, bcryptRounds);
        const userRole = role || types_1.Role.CASHIER;
        if (userRole === types_1.Role.ADMIN && req.user?.role !== types_1.Role.ADMIN) {
            throw new errors_1.UnauthorizedError('Only admins can create admin users');
        }
        const user = await db_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || null,
                role: userRole,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        const accessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(tokenPayload);
        res.status(201).json({
            success: true,
            data: {
                user,
                tokens: {
                    accessToken,
                    refreshToken,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await db_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        if (!user.isActive) {
            throw new errors_1.UnauthorizedError('Account is deactivated');
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        const accessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(tokenPayload);
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    isActive: user.isActive,
                },
                tokens: {
                    accessToken,
                    refreshToken,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken: token } = req.body;
        if (!token) {
            throw new errors_1.ValidationError('Refresh token is required');
        }
        const decoded = (0, jwt_1.verifyRefreshToken)(token);
        const user = await db_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
            },
        });
        if (!user || !user.isActive) {
            throw new errors_1.UnauthorizedError('User not found or inactive');
        }
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        const newAccessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const newRefreshToken = (0, jwt_1.generateRefreshToken)(tokenPayload);
        res.json({
            success: true,
            data: {
                tokens: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.refreshToken = refreshToken;
const getProfile = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('User not authenticated');
        }
        const user = await db_1.prisma.user.findUnique({
            where: { id: req.user.userId },
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
exports.getProfile = getProfile;
const updateProfile = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('User not authenticated');
        }
        const { name } = req.body;
        const user = await db_1.prisma.user.update({
            where: { id: req.user.userId },
            data: {
                ...(name && { name }),
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
            data: { user },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('User not authenticated');
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            throw new errors_1.ValidationError('Current password and new password are required');
        }
        if (newPassword.length < 8) {
            throw new errors_1.ValidationError('New password must be at least 8 characters');
        }
        const user = await db_1.prisma.user.findUnique({
            where: { id: req.user.userId },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        const isCurrentPasswordValid = await bcrypt_1.default.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new errors_1.UnauthorizedError('Current password is incorrect');
        }
        const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
        const hashedNewPassword = await bcrypt_1.default.hash(newPassword, bcryptRounds);
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedNewPassword },
        });
        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.changePassword = changePassword;
//# sourceMappingURL=auth.controller.js.map