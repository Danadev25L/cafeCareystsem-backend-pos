@echo off
echo 🌟 Running CafeCare Enhanced Seeder with Images...
echo.

REM Check if DATABASE_URL is set
if "%DATABASE_URL%"=="" (
    echo ❌ DATABASE_URL environment variable is not set!
    echo Please set your database connection string:
    echo set DATABASE_URL=postgresql://username:password@localhost:5432/database_name
    echo.
    pause
    exit /b 1
)

echo 🗄️ Database URL: %DATABASE_URL%
echo.

REM Run the seeder
npx ts-node prisma/seed-with-images.ts

echo.
echo ✅ Seeder completed! Your CafeCare application is now populated with:
echo    • 6 User accounts (Admin, Captain, Cashier)
echo    • 10 Restaurant tables
echo    • 6 Menu categories
echo    • 24+ Menu items with beautiful images
echo.
echo 🚀 You can now start the application and login with:
echo    Admin: admin@cafecare.com / admin123
echo    Captain: captain@cafecare.com / captain123
echo    Cashier: cashier1@cafecare.com / cashier123
echo.
pause