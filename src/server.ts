import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { resolve } from 'path';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import tableRoutes from './routes/table.routes';
import menuCategoryRoutes from './routes/menuCategory.routes';
import menuItemRoutes from './routes/menuItem.routes';
import orderRoutes from './routes/order.routes';
import serviceChargeRoutes from './routes/serviceCharge.routes';
import discountRoutes from './routes/discount.routes';
import analyticsRoutes from './routes/analytics.routes';
import orderModificationsRoutes from './routes/order-modifications.routes';
import qualityControlRoutes from './routes/quality-control.routes';
import kitchenRoutes from './routes/kitchen.routes';
import publicRoutes from './routes/public.routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { securityHeaders, requestLogger } from './middlewares/security.middleware';
import { initializeSocket } from './utils/socket';
import { execSync } from 'child_process';

// Load environment variables - same path resolution as jwt.ts
const envPath = resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const app: Express = express();
const httpServer = createServer(app);
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Trust proxy - required when behind a reverse proxy (Railway, Heroku, etc.)
// This allows express-rate-limit to correctly identify client IPs from X-Forwarded-For headers
// Set to 1 to trust the first proxy (Railway, Heroku, etc.)
app.set('trust proxy', 1);

// Initialize Socket.IO
initializeSocket(httpServer);

// Security Middlewares
app.use(securityHeaders);
app.use(requestLogger);
app.use(helmet({
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
function normalizeOrigin(origin: string): string {
  // Remove protocol for comparison
  return origin.replace(/^https?:\/\//, '').toLowerCase();
}

let allowedOrigins: string[] = [];
if (process.env.CORS_ORIGIN) {
  if (typeof process.env.CORS_ORIGIN === 'string') {
    allowedOrigins = process.env.CORS_ORIGIN.split(',').map(origin => {
      const trimmed = origin.trim();
      // Normalize: remove protocol if present, we'll compare without it
      return normalizeOrigin(trimmed);
    });
  } else {
    allowedOrigins = (process.env.CORS_ORIGIN as string[]).map(normalizeOrigin);
  }
} else {
  allowedOrigins = ['localhost:3000', 'localhost:3001'];
}

app.use(cors({
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

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper function to use ipKeyGenerator with request object
const createKeyGenerator = () => {
  return (req: Request) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return ipKeyGenerator(ip);
  };
};

// Rate Limiting - Much more lenient for development
const limiter = rateLimit({
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

const authLimiter = rateLimit({
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
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'CafeSystem API is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Welcome to CafeSystem API',
    version: '1.0.0',
  });
});

// Public Routes (no authentication required)
app.use('/api/public', publicRoutes);

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/menu-categories', menuCategoryRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/service-charge-settings', serviceChargeRoutes);
app.use('/api/discount-settings', discountRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/order-modifications', orderModificationsRoutes);
app.use('/api/quality', qualityControlRoutes);
app.use('/api/kitchen', kitchenRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Function to run seeder on deployment
async function runSeederOnDeploy() {
  // Only run seeder in production or when explicitly enabled
  const shouldRunSeeder = process.env.NODE_ENV === 'production' || process.env.RUN_SEEDER_ON_START === 'true';

  if (shouldRunSeeder) {
    try {
      console.log('🌱 Running seeder on server start...');
      execSync('npx ts-node prisma/seed-with-images.ts', {
        stdio: 'inherit',
        env: process.env,
        cwd: process.cwd()
      });
      console.log('✅ Seeder completed successfully!');
    } catch (error: any) {
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
    console.log(`🚀 CafeSystem API Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  });
}

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Handle server errors
httpServer.on('error', (error: NodeJS.ErrnoException) => {
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
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
