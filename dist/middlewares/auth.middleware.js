"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireBarista = exports.requireCaptain = exports.requireAdmin = exports.authorize = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const types_1 = require("../types");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errors_1.UnauthorizedError('No token provided');
        }
        const token = authHeader.substring(7);
        try {
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            req.user = decoded;
            next();
        }
        catch (error) {
            throw new errors_1.UnauthorizedError('Invalid or expired token');
        }
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                console.log('❌ Authorization failed: No user in request');
                throw new errors_1.UnauthorizedError('Authentication required');
            }
            console.log('🔐 Authorization check:', {
                userRole: req.user.role,
                allowedRoles,
                hasPermission: allowedRoles.includes(req.user.role)
            });
            if (!allowedRoles.includes(req.user.role)) {
                console.log('❌ Authorization failed: Insufficient permissions');
                throw new errors_1.ForbiddenError('Insufficient permissions');
            }
            console.log('✅ Authorization passed');
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorize = authorize;
exports.requireAdmin = (0, exports.authorize)(types_1.Role.ADMIN);
exports.requireCaptain = (0, exports.authorize)(types_1.Role.CAPTAIN, types_1.Role.ADMIN);
exports.requireBarista = (0, exports.authorize)(types_1.Role.CASHIER, types_1.Role.CAPTAIN, types_1.Role.ADMIN);
//# sourceMappingURL=auth.middleware.js.map