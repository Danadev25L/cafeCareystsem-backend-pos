"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = require("path");
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importStar(require("express-rate-limit"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const table_routes_1 = __importDefault(require("./routes/table.routes"));
const menuCategory_routes_1 = __importDefault(require("./routes/menuCategory.routes"));
const menuItem_routes_1 = __importDefault(require("./routes/menuItem.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const serviceCharge_routes_1 = __importDefault(require("./routes/serviceCharge.routes"));
const discount_routes_1 = __importDefault(require("./routes/discount.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const order_modifications_routes_1 = __importDefault(require("./routes/order-modifications.routes"));
const quality_control_routes_1 = __importDefault(require("./routes/quality-control.routes"));
const kitchen_routes_1 = __importDefault(require("./routes/kitchen.routes"));
const public_routes_1 = __importDefault(require("./routes/public.routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const security_middleware_1 = require("./middlewares/security.middleware");
const socket_1 = require("./utils/socket");
const child_process_1 = require("child_process");
// Load environment variables - same path resolution as jwt.ts
const envPath = (0, path_1.resolve)(process.cwd(), '.env');
dotenv_1.default.config({ path: envPath });
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
// Trust proxy - required when behind a reverse proxy (Railway, Heroku, etc.)
// This allows express-rate-limit to correctly identify client IPs from X-Forwarded-For headers
// Set to 1 to trust the first proxy (Railway, Heroku, etc.)
app.set('trust proxy', 1);
// Initialize Socket.IO
(0, socket_1.initializeSocket)(httpServer);
// Security Middlewares
app.use(security_middleware_1.securityHeaders);
app.use(security_middleware_1.requestLogger);
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
// CORS configuration - handle both string and array origins
function normalizeOrigin(origin) {
    // Remove protocol for comparison
    return origin.replace(/^https?:\/\//, '').toLowerCase();
}
let allowedOrigins = [];
if (process.env.CORS_ORIGIN) {
    if (typeof process.env.CORS_ORIGIN === 'string') {
        allowedOrigins = process.env.CORS_ORIGIN.split(',').map(origin => {
            const trimmed = origin.trim();
            // Normalize: remove protocol if present, we'll compare without it
            return normalizeOrigin(trimmed);
        });
    }
    else {
        allowedOrigins = process.env.CORS_ORIGIN.map(normalizeOrigin);
    }
}
else {
    allowedOrigins = ['localhost:3000', 'localhost:3001'];
}
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }
        // Normalize origin for comparison (remove protocol)
        const normalizedOrigin = normalizeOrigin(origin);
        // Check if normalized origin is in allowed list
        if (allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
        }
        // In development, allow any localhost origin
        if (process.env.NODE_ENV !== 'production') {
            if (normalizedOrigin.startsWith('localhost:') ||
                normalizedOrigin.startsWith('127.0.0.1:') ||
                normalizedOrigin.startsWith('192.168.')) {
                return callback(null, true);
            }
        }
        // Allow Railway internal domains (check normalized origin)
        if (normalizedOrigin.includes('.railway.internal') || normalizedOrigin.includes('.railway.app')) {
            return callback(null, true);
        }
        // Reject other origins
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Helper function to use ipKeyGenerator with request object
const createKeyGenerator = () => {
    return (req) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        return (0, express_rate_limit_1.ipKeyGenerator)(ip);
    };
};
// Rate Limiting - Much more lenient for development
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 1000 : 5000, // Much more lenient limits
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
    // Use ipKeyGenerator helper to properly handle IPv6 addresses
    keyGenerator: createKeyGenerator(),
    skip: (req) => {
        // Skip rate limiting for health checks and in development
        return req.path === '/health' || req.path === '/' || process.env.NODE_ENV !== 'production';
    },
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 50 : 200, // Much more lenient for development
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts, please try again later.',
    // Use ipKeyGenerator helper to properly handle IPv6 addresses
    keyGenerator: createKeyGenerator(),
    skip: (req) => {
        // Skip auth rate limiting in development
        return process.env.NODE_ENV !== 'production';
    },
});
app.use(limiter);
// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'CafeCare API is running',
        timestamp: new Date().toISOString(),
    });
});
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to CafeCare API',
        version: '1.0.0',
    });
});
// Public Routes (no authentication required)
app.use('/api/public', public_routes_1.default);
// API Routes
app.use('/api/auth', authLimiter, auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/tables', table_routes_1.default);
app.use('/api/menu-categories', menuCategory_routes_1.default);
app.use('/api/menu-items', menuItem_routes_1.default);
app.use('/api/orders', order_routes_1.default);
app.use('/api/service-charge-settings', serviceCharge_routes_1.default);
app.use('/api/discount-settings', discount_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/order-modifications', order_modifications_routes_1.default);
app.use('/api/quality', quality_control_routes_1.default);
app.use('/api/kitchen', kitchen_routes_1.default);
// Error Handling
app.use(error_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
// Function to run seeder on deployment
async function runSeederOnDeploy() {
    // Only run seeder in production or when explicitly enabled
    const shouldRunSeeder = process.env.NODE_ENV === 'production' || process.env.RUN_SEEDER_ON_START === 'true';
    if (shouldRunSeeder) {
        try {
            console.log('🌱 Running seeder on server start...');
            (0, child_process_1.execSync)('npx ts-node prisma/seed-with-images.ts', {
                stdio: 'inherit',
                env: process.env,
                cwd: process.cwd()
            });
            console.log('✅ Seeder completed successfully!');
        }
        catch (error) {
            console.error('❌ Seeder failed:', error.message);
            console.log('⚠️ Server will continue starting despite seeder failure...');
        }
    }
}
// Start server with seeder
async function startServer() {
    // Run seeder first if needed
    await runSeederOnDeploy();
    httpServer.listen(port, '0.0.0.0', () => {
        console.log(`🚀 CafeCare API Server running on port ${port}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
    });
}
startServer().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
// Handle server errors
httpServer.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;
    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
});
// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
//# sourceMappingURL=server.js.map