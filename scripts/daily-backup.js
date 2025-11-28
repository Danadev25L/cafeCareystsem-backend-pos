#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🌙 Starting daily backup process...');
const startTime = new Date();

try {
  console.log('\n1️⃣ Creating local backup...');
  execSync('node scripts/backup-database.js', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  // Check if backup server is configured
  const backupEnvPath = path.join(__dirname, '../.env.backup');
  if (fs.existsSync(backupEnvPath)) {
    console.log('\n2️⃣ Syncing to backup server...');
    execSync('node scripts/sync-to-backup-server.js', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
  } else {
    console.log('\n⚠️ Backup server not configured. Run "node setup-backup-server.js" to set up remote backup.');
  }

  const endTime = new Date();
  const duration = Math.round((endTime - startTime) / 1000);

  console.log(`\n🎉 Daily backup completed in ${duration} seconds!`);
  console.log(`✅ All backups created at: ${endTime.toISOString()}`);

  // Log backup success
  const logFile = path.join(__dirname, '../backups/backup.log');
  const logEntry = `${endTime.toISOString()} - SUCCESS - Daily backup completed\n`;
  fs.appendFileSync(logFile, logEntry);

} catch (error) {
  console.error('\n❌ Daily backup failed:', error.message);

  // Log backup failure
  const logFile = path.join(__dirname, '../backups/backup.log');
  const logEntry = `${new Date().toISOString()} - FAILED - ${error.message}\n`;
  fs.appendFileSync(logFile, logEntry);

  process.exit(1);
}