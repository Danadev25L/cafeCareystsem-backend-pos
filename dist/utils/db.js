"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn', 'query'] : ['error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });
// Test database connection on startup
exports.prisma.$connect()
    .then(() => {
    console.log('✅ Database connected successfully');
})
    .catch((error) => {
    console.error('❌ Database connection failed:', error);
    console.error('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
});
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
exports.default = exports.prisma;
//# sourceMappingURL=db.js.map