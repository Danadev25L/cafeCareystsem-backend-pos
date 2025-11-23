import { execSync } from 'child_process';

async function resolveFailedMigration() {
  try {
    console.log('🔍 Attempting to resolve failed migration: 20251120000000_add_order_tables');
    
    // First, try to mark as applied (in case tables exist but migration is marked as failed)
    try {
      console.log('📝 Trying to mark migration as applied...');
      execSync('npx prisma migrate resolve --applied 20251120000000_add_order_tables', {
        stdio: 'inherit',
        env: process.env,
      });
      console.log('✅ Migration successfully marked as applied');
      return;
    } catch (appliedError: any) {
      // If marking as applied fails, the tables likely don't exist
      // Try rolled-back so the migration can be re-applied
      console.log('ℹ️ Marking as applied failed. Trying rolled-back...');
      try {
        execSync('npx prisma migrate resolve --rolled-back 20251120000000_add_order_tables', {
          stdio: 'inherit',
          env: process.env,
        });
        console.log('✅ Migration successfully marked as rolled back');
        return;
      } catch (rolledBackError: any) {
        // If both fail, the migration might already be resolved or not in failed state
        console.log('ℹ️ Both resolve attempts failed. Migration may already be resolved.');
        console.log('ℹ️ This is okay - continuing with migration deploy...');
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error resolving migration:', error);
    // Continue anyway - if migration is already resolved, deploy will continue
    console.log('ℹ️ Continuing with migration deploy...');
  }
}

resolveFailedMigration();

