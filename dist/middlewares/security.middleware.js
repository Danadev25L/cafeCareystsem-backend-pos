"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = exports.securityHeaders = void 0;
const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
};
exports.securityHeaders = securityHeaders;
const requestLogger = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    }
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=security.middleware.js.map