import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';

let io: SocketServer | null = null;

export const initializeSocket = (httpServer: HttpServer) => {
  // CORS configuration for Socket.IO
  // Parse CORS_ORIGIN from env or use defaults
  let allowedOrigins: string[];
  if (process.env.CORS_ORIGIN) {
    if (typeof process.env.CORS_ORIGIN === 'string') {
      allowedOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
    } else {
      allowedOrigins = process.env.CORS_ORIGIN as string[];
    }
  } else {
    allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
  }

  io = new SocketServer(httpServer, {
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

  io.on('connection', (socket: Socket) => {
    // Silent connection handling
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};

export const emitOrderCreated = (order: any) => {
  if (io) {
    io.emit('order:created', order);
  }
};

export const emitOrderUpdated = (order: any) => {
  if (io) {
    io.emit('order:updated', order);
  }
};

export const emitOrderDeleted = (orderId: number) => {
  if (io) {
    io.emit('order:deleted', { orderId });
  }
};

export const emitOrderReady = (order: any) => {
  if (io) {
    io.emit('order:ready', order);
  }
};

