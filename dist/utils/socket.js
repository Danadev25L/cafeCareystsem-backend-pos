"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitOrderReady = exports.emitOrderDeleted = exports.emitOrderUpdated = exports.emitOrderCreated = exports.getIO = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
let io = null;
const initializeSocket = (httpServer) => {
    // CORS configuration for Socket.IO
    // Parse CORS_ORIGIN from env or use defaults
    let allowedOrigins;
    if (process.env.CORS_ORIGIN) {
        if (typeof process.env.CORS_ORIGIN === 'string') {
            allowedOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
        }
        else {
            allowedOrigins = process.env.CORS_ORIGIN;
        }
    }
    else {
        allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
    }
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                // Allow requests with no origin (like Postman, curl, etc.)
                if (!origin) {
                    return callback(null, true);
                }
                // Check if origin is in allowed list
                if (allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }
                // In development, allow any localhost origin
                if (process.env.NODE_ENV !== 'production') {
                    if (origin.startsWith('http://localhost:') ||
                        origin.startsWith('http://127.0.0.1:') ||
                        origin.startsWith('http://192.168.')) {
                        return callback(null, true);
                    }
                }
                // Reject other origins
                callback(new Error('Not allowed by CORS'));
            },
            methods: ['GET', 'POST', 'OPTIONS'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        },
        transports: ['polling', 'websocket'], // Allow both transports
        allowEIO3: true, // Allow Engine.IO v3 clients
        pingTimeout: 60000,
        pingInterval: 25000,
    });
    io.on('connection', (socket) => {
        // Silent connection handling
    });
    return io;
};
exports.initializeSocket = initializeSocket;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized. Call initializeSocket first.');
    }
    return io;
};
exports.getIO = getIO;
const emitOrderCreated = (order) => {
    if (io) {
        io.emit('order:created', order);
    }
};
exports.emitOrderCreated = emitOrderCreated;
const emitOrderUpdated = (order) => {
    if (io) {
        io.emit('order:updated', order);
    }
};
exports.emitOrderUpdated = emitOrderUpdated;
const emitOrderDeleted = (orderId) => {
    if (io) {
        io.emit('order:deleted', { orderId });
    }
};
exports.emitOrderDeleted = emitOrderDeleted;
const emitOrderReady = (order) => {
    if (io) {
        io.emit('order:ready', order);
    }
};
exports.emitOrderReady = emitOrderReady;
//# sourceMappingURL=socket.js.map