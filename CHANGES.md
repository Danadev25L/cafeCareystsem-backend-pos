# Changes Summary - Backend

## Modified Files:
- `SETUP_FIRST_ADMIN.md` - Documentation updates
- `prisma/schema.prisma` - Database schema updates
- `prisma/seed.ts` - Database seeding updates
- `prisma/seed-with-images.ts` - Database seeding with images updates
- `src/controllers/analytics.controller.ts` - Analytics functionality updates
- `src/controllers/order.controller.ts` - Order management updates
- `src/routes/order.routes.ts` - Order routing updates
- `src/routes/public.routes.ts` - Public route updates
- `src/server.ts` - Server configuration updates

## New Files:
- `src/controllers/discount.controller.ts` - Discount management controller
- `src/routes/discount.routes.ts` - Discount routing

## Database Migrations:
- `prisma/migrations/20251125000000_add_discount_settings/` - Discount settings migration
- `prisma/migrations/20251126000000_make_tableId_nullable/` - Table ID nullable migration

## Key Changes:
- Added discount management functionality
- Updated order processing
- Modified database schema for new features
- Updated seeding scripts

Generated on: 2025-12-14