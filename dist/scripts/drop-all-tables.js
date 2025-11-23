"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function dropAllTables() {
    try {
        console.log('🗑️  Dropping all tables...');
        // Disable foreign key constraints temporarily
        await prisma.$executeRawUnsafe('SET session_replication_role = replica;');
        // Get all table names
        const tables = await prisma.$queryRawUnsafe(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE '_prisma%';`);
        if (tables.length === 0) {
            console.log('ℹ️  No tables to drop');
            return;
        }
        // Drop all tables with CASCADE
        for (const table of tables) {
            try {
                await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE;`);
                console.log(`   ✓ Dropped table: ${table.tablename}`);
            }
            catch (error) {
                console.log(`   ⚠️  Could not drop table ${table.tablename}: ${error.message}`);
            }
        }
        // Drop all enums
        try {
            const enums = await prisma.$queryRawUnsafe(`SELECT typname FROM pg_type WHERE typtype = 'e' AND typname NOT LIKE '_prisma%';`);
            for (const enumType of enums) {
                try {
                    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "${enumType.typname}" CASCADE;`);
                    console.log(`   ✓ Dropped enum: ${enumType.typname}`);
                }
                catch (error) {
                    console.log(`   ⚠️  Could not drop enum ${enumType.typname}: ${error.message}`);
                }
            }
        }
        catch (error) {
            console.log(`   ⚠️  Could not drop enums: ${error.message}`);
        }
        // Re-enable foreign key constraints
        await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;');
        console.log('✅ All tables dropped successfully\n');
    }
    catch (error) {
        console.error('❌ Error dropping tables:', error.message);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
dropAllTables()
    .then(() => {
    console.log('✅ Drop tables completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('❌ Drop tables failed:', error);
    process.exit(1);
});
//# sourceMappingURL=drop-all-tables.js.map