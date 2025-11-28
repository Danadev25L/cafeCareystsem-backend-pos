"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function verifyTables() {
    try {
        console.log('🔍 Verifying database tables...\n');
        // Prisma creates tables with the model name as-is (PostgreSQL will lowercase unquoted identifiers)
        // So we need to check for both the exact model name and the lowercase version
        const requiredTables = [
            'User',
            'Table',
            'MenuCategory',
            'MenuItem',
            'Order',
            'OrderItem',
            'ServiceChargeSettings',
            'Analytics',
            'OrderModification',
            'CustomerFeedback',
            'PreparationTime',
        ];
        const existingTables = await prisma.$queryRawUnsafe(`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;`);
        const tableNames = existingTables.map(t => t.tablename.toLowerCase());
        console.log('📊 Existing tables:', existingTables.map(t => t.tablename).join(', ') || 'None\n');
        const missingTables = [];
        for (const table of requiredTables) {
            // Prisma uses model name as table name, PostgreSQL lowercases unquoted identifiers
            // So "User" -> "user", "MenuCategory" -> "menucategory" (not "menu_category")
            const tableNameLower = table.toLowerCase();
            if (!tableNames.includes(tableNameLower)) {
                missingTables.push(table);
                console.log(`   ❌ Table missing: ${table} (expected: ${tableNameLower})`);
            }
            else {
                console.log(`   ✅ Table exists: ${tableNameLower}`);
            }
        }
        if (missingTables.length > 0) {
            console.log(`\n❌ Missing tables: ${missingTables.join(', ')}`);
            console.log('⚠️  Some required tables are missing from the database');
            return false;
        }
        console.log('\n✅ All required tables exist!\n');
        return true;
    }
    catch (error) {
        console.error('❌ Error verifying tables:', error.message);
        return false;
    }
    finally {
        await prisma.$disconnect();
    }
}
verifyTables()
    .then((success) => {
    process.exit(success ? 0 : 1);
})
    .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
//# sourceMappingURL=verify-tables.js.map