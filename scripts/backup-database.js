#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;
const BACKUP_DIR = path.join(__dirname, '../backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];

console.log('🔄 Starting database backup...');

// Create backups directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log('📁 Created backups directory');
}

// Backup filename
const backupFile = path.join(BACKUP_DIR, `cafecare_backup_${TIMESTAMP}.sql`);

try {
  console.log('📦 Creating database dump...');

  // Use pg_dump to create backup
  const command = `pg_dump "${DATABASE_URL}" > "${backupFile}"`;

  console.log(`Running: ${command}`);
  execSync(command, { stdio: 'inherit' });

  console.log(`✅ Backup created successfully: ${backupFile}`);

  // Get file size
  const stats = fs.statSync(backupFile);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📊 Backup size: ${fileSizeInMB} MB`);

  // Compress the backup
  console.log('🗜️ Compressing backup...');
  execSync(`gzip "${backupFile}"`, { stdio: 'inherit' });

  const compressedFile = `${backupFile}.gz`;
  const compressedStats = fs.statSync(compressedFile);
  const compressedSizeInMB = (compressedStats.size / (1024 * 1024)).toFixed(2);
  console.log(`✅ Compressed backup created: ${compressedFile}`);
  console.log(`📊 Compressed size: ${compressedSizeInMB} MB`);

  // Keep only last 7 backups
  console.log('🧹 Cleaning up old backups...');
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith('.gz'))
    .map(file => ({
      name: file,
      path: path.join(BACKUP_DIR, file),
      time: fs.statSync(path.join(BACKUP_DIR, file)).mtime
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length > 7) {
    const filesToDelete = files.slice(7);
    filesToDelete.forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`🗑️ Deleted old backup: ${file.name}`);
    });
  }

  console.log('🎉 Backup process completed successfully!');

} catch (error) {
  console.error('❌ Backup failed:', error.message);
  process.exit(1);
}