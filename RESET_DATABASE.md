# How to Reset the Database

## Prerequisites
Make sure you have a `.env` file in the `backend` directory with a valid `DATABASE_URL`:
```
DATABASE_URL="postgresql://username:password@localhost:5432/cafecare?schema=public"
```

## Reset Database (Drops all data and recreates schema)

### Option 1: Using Prisma Migrate Reset (Recommended)
```bash
cd backend
npx prisma migrate reset --force
```

This will:
- Drop the database
- Create a new database
- Apply all migrations
- Run the seed script (creates default users and menu items)

### Option 2: Using Prisma DB Push (Alternative)
```bash
cd backend
npx prisma db push --force-reset
npx prisma db seed
```

## After Reset
1. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

2. Verify the database:
   ```bash
   npx prisma studio
   ```

## Default Users Created by Seed
- admin@cafecare.com / admin123 (ADMIN)
- captain@cafecare.com / captain123 (CAPTAIN)
- barista@cafecare.com / barista123 (CASHIER)
- john@cafecare.com / john123 (CASHIER)
- jane@cafecare.com / jane123 (CASHIER)

## Note
⚠️ **WARNING**: This will delete ALL data in your database. Make sure you have backups if needed.

