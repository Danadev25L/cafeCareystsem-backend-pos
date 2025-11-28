#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Load backup server configuration
const backupEnvPath = path.join(__dirname, '../.env.backup');
let backupConfig = {};

if (fs.existsSync(backupEnvPath)) {
  const backupEnv = fs.readFileSync(backupEnvPath, 'utf8');
  backupEnv.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      backupConfig[key] = value;
    }
  });
}

const SOURCE_DATABASE_URL = process.env.DATABASE_URL;
const TARGET_DATABASE_URL = backupConfig.NEW_DATABASE_URL;
const SSH_HOST = backupConfig.SSH_HOST;
const SSH_USER = backupConfig.SSH_USER;
const SSH_KEY_PATH = backupConfig.SSH_KEY_PATH;

if (!TARGET_DATABASE_URL || !SSH_HOST) {
  console.error('❌ Please configure .env.backup file first!');
  console.log('Run: node setup-backup-server.js');
  process.exit(1);
}

console.log('🔄 Syncing database to backup server...');

try {
  console.log('📦 Creating dump from source database...');

  // Create temporary dump file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const dumpFile = `/tmp/cafecare_sync_${timestamp}.sql`;

  // Dump from source database
  const dumpCommand = `pg_dump "${SOURCE_DATABASE_URL}" > ${dumpFile}`;
  console.log(`Running: ${dumpCommand}`);
  execSync(dumpCommand, { stdio: 'inherit' });

  // Compress the dump
  console.log('🗜️ Compressing dump...');
  execSync(`gzip ${dumpFile}`, { stdio: 'inherit' });
  const compressedDump = `${dumpFile}.gz`;

  // Get compressed file size
  const stats = fs.statSync(compressedDump);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📊 Dump size: ${fileSizeInMB} MB`);

  // Create backup directory on remote server if it doesn't exist
  console.log('📁 Creating backup directory on remote server...');
  const createDirCommand = backupConfig.SSH_KEY_PATH
    ? `ssh -i ${backupConfig.SSH_KEY_PATH} ${backupConfig.SSH_USER}@${backupConfig.SSH_HOST} "mkdir -p ${backupConfig.REMOTE_BACKUP_DIR}"`
    : `ssh ${backupConfig.SSH_USER}@${backupConfig.SSH_HOST} "mkdir -p ${backupConfig.REMOTE_BACKUP_DIR}"`;

  execSync(createDirCommand, { stdio: 'inherit' });

  // Transfer compressed dump to backup server
  console.log('📤 Transferring dump to backup server...');
  const transferCommand = backupConfig.SSH_KEY_PATH
    ? `scp -i ${backupConfig.SSH_KEY_PATH} ${compressedDump} ${backupConfig.SSH_USER}@${backupConfig.SSH_HOST}:${backupConfig.REMOTE_BACKUP_DIR}/`
    : `scp ${compressedDump} ${backupConfig.SSH_USER}@${backupConfig.SSH_HOST}:${backupConfig.REMOTE_BACKUP_DIR}/`;

  console.log(`Running: ${transferCommand}`);
  execSync(transferCommand, { stdio: 'inherit' });

  // Restore on backup server
  console.log('🗃️ Restoring database on backup server...');
  const restoreCommand = backupConfig.SSH_KEY_PATH
    ? `ssh -i ${backupConfig.SSH_KEY_PATH} ${backupConfig.SSH_USER}@${backupConfig.SSH_HOST} "gunzip -c ${backupConfig.REMOTE_BACKUP_DIR}/$(basename ${compressedDump}) | psql '${TARGET_DATABASE_URL}'"`
    : `ssh ${backupConfig.SSH_USER}@${backupConfig.SSH_HOST} "gunzip -c ${backupConfig.REMOTE_BACKUP_DIR}/$(basename ${compressedDump}) | psql '${TARGET_DATABASE_URL}'"`;

  console.log(`Running: ${restoreCommand}`);
  execSync(restoreCommand, { stdio: 'inherit' });

  // Clean up local temporary files
  console.log('🧹 Cleaning up local temporary files...');
  fs.unlinkSync(compressedDump);

  // Clean up old remote backups (keep last 7)
  console.log('🧹 Cleaning up old remote backups...');
  const cleanupCommand = backupConfig.SSH_KEY_PATH
    ? `ssh -i ${backupConfig.SSH_KEY_PATH} ${backupConfig.SSH_USER}@${backupConfig.SSH_HOST} "cd ${backupConfig.REMOTE_BACKUP_DIR} && ls -t *.sql.gz | tail -n +8 | xargs -r rm"`
    : `ssh ${backupConfig.SSH_USER}@${backupConfig.SSH_HOST} "cd ${backupConfig.REMOTE_BACKUP_DIR} && ls -t *.sql.gz | tail -n +8 | xargs -r rm"`;

  execSync(cleanupCommand, { stdio: 'inherit' });

  console.log('✅ Database successfully synced to backup server!');
  console.log('🎉 Your backup database is now up to date!');

} catch (error) {
  console.error('❌ Sync failed:', error.message);
  process.exit(1);
}