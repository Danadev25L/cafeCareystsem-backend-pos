#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;
const BACKUP_DIR = path.join(__dirname, '../backups');

console.log('🔄 Starting database restoration...');

// Get backup file from command line argument or list available backups
const backupFile = process.argv[2];

if (!backupFile) {
  console.log('\n📋 Available backup files:');
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.gz'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.log('❌ No backup files found in', BACKUP_DIR);
      process.exit(1);
    }

    files.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });

    console.log('\n💡 Usage: node restore-database.js <backup-file-name>');
    console.log('Example: node restore-database.js cafecare_backup_2024-01-15.sql.gz');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error reading backup directory:', error.message);
    process.exit(1);
  }
}

const backupPath = path.join(BACKUP_DIR, backupFile);

if (!fs.existsSync(backupPath)) {
  console.error(`❌ Backup file not found: ${backupPath}`);
  process.exit(1);
}

try {
  console.log(`📦 Restoring from: ${backupFile}`);

  // Check if backup is compressed
  const isCompressed = backupFile.endsWith('.gz');
  let tempFile = null;

  if (isCompressed) {
    console.log('📂 Decompressing backup file...');
    tempFile = backupPath.replace('.gz', '');
    execSync(`gunzip -c "${backupPath}" > "${tempFile}"`, { stdio: 'inherit' });
  }

  const fileToRestore = isCompressed ? tempFile : backupPath;

  console.log('🗃️ Restoring database...');

  // Drop and recreate database
  console.log('🧹 Cleaning existing database...');

  // Extract database info from DATABASE_URL
  const dbUrl = new URL(DATABASE_URL);
  const dbName = dbUrl.pathname.substring(1); // Remove leading slash
  const dbUrlWithoutDb = DATABASE_URL.replace(`/${dbName}`, '/postgres');

  // Drop database if it exists
  try {
    execSync(`psql "${dbUrlWithoutDb}" -c "DROP DATABASE IF EXISTS ${dbName}"`, { stdio: 'inherit' });
  } catch (error) {
    console.log('Database might not exist, continuing...');
  }

  // Create new database
  execSync(`psql "${dbUrlWithoutDb}" -c "CREATE DATABASE ${dbName}"`, { stdio: 'inherit' });

  // Restore the data
  execSync(`psql "${DATABASE_URL}" < "${fileToRestore}"`, { stdio: 'inherit' });

  // Clean up temporary file
  if (tempFile && fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
    console.log('🧹 Cleaned up temporary files');
  }

  console.log('✅ Database restored successfully!');
  console.log('🎉 All data has been restored from backup!');

} catch (error) {
  console.error('❌ Restore failed:', error.message);
  process.exit(1);
}