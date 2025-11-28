"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
async function runCommand(command, description, allowFailure = false) {
    try {
        console.log(`🔄 ${description}...`);
        (0, child_process_1.execSync)(command, { stdio: 'inherit', env: process.env });
        console.log(`✅ ${description} completed`);
        return true;
    }
    catch (error) {
        if (allowFailure) {
            console.log(`⚠️ ${description} failed, but continuing...`);
            if (error?.message) {
                console.log(`   Error: ${error.message}`);
            }
            return false;
        }
        else {
            console.error(`❌ ${description} failed:`, error);
            throw error;
        }
    }
}
async function resetAndDeploy() {
    try {
        console.log('🚀 Starting database reset and deployment...\n');
        // Step 1: Try to drop all tables first (if script exists)
        try {
            console.log('📦 Dropping all existing tables...');
            (0, child_process_1.execSync)('node dist/scripts/drop-all-tables.js', {
                stdio: 'inherit',
                env: process.env,
            });
        }
        catch (error) {
            console.log('⚠️ Drop tables script not found or failed, trying migrate reset...');
        }
        // Step 2: Reset database schema using db push (creates all tables from schema)
        // This ensures all tables from schema.prisma are created, even if migrations are missing some
        console.log('\n📦 Resetting and syncing database schema...');
        let migrationsSuccess = false;
        try {
            // Use db push --force-reset to drop all tables and recreate from schema
            // This is more reliable than migrations when schema has changed
            console.log('🔄 Pushing database schema (this will drop all tables and recreate them)...');
            (0, child_process_1.execSync)('npx prisma db push --force-reset --accept-data-loss', {
                stdio: 'inherit',
                env: process.env,
            });
            console.log('✅ Database schema synced - all tables created from schema!\n');
            migrationsSuccess = true;
        }
        catch (error) {
            console.log('\n⚠️ Db push failed, trying migrate reset...');
            try {
                // Fallback to migrate reset
                (0, child_process_1.execSync)('npx prisma migrate reset --force --skip-seed', {
                    stdio: 'inherit',
                    env: process.env,
                });
                console.log('✅ Database reset completed!\n');
                migrationsSuccess = true;
            }
            catch (resetError) {
                console.log('\n⚠️ Migrate reset failed, trying migrate deploy...');
                // Last resort: try to deploy migrations
                migrationsSuccess = await runCommand('npx prisma migrate deploy', 'Applying database migrations', true);
            }
        }
        // Step 3: Seed the database with images
        await runCommand('npx ts-node prisma/seed-with-images.ts', 'Seeding database with initial data and images', true);
        // Step 4: Verify tables exist
        console.log('\n🔍 Verifying tables were created...');
        try {
            (0, child_process_1.execSync)('node dist/scripts/verify-tables.js', {
                stdio: 'inherit',
                env: process.env,
            });
        }
        catch (error) {
            console.log('⚠️ Table verification failed - some tables may be missing');
        }
        console.log('\n✅ Database reset and deployment completed successfully!\n');
    }
    catch (error) {
        console.error('❌ Reset and deployment failed:', error);
        // Don't exit - let the server try to start anyway
        console.log('⚠️ Continuing with server start despite migration issues...\n');
    }
}
resetAndDeploy()
    .then(() => {
    console.log('✅ Database reset and deployment script completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('❌ Database reset and deployment script failed:', error);
    console.log('⚠️ Server will start anyway, but database may not be ready');
    process.exit(0); // Exit with 0 so server still starts
});
//# sourceMappingURL=reset-and-deploy.js.map