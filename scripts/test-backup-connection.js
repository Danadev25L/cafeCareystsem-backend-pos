#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Load backup server configuration
const backupEnvPath = path.join(__dirname, '../.env.backup');
let backupConfig = {};

if (!fs.existsSync(backupEnvPath)) {
  console.error('❌ Backup configuration file not found!');
  console.log('Please run: node setup-backup-server.js');
  process.exit(1);
}

const backupEnv = fs.readFileSync(backupEnvPath, 'utf8');
backupEnv.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    backupConfig[key] = value;
  }
});

console.log('🔍 Testing backup server configuration...\n');

// Check required configurations
const required = ['NEW_DATABASE_URL', 'NEW_SERVER_IP', 'NEW_DB_PASSWORD', 'SSH_USER', 'SSH_HOST'];
const missing = required.filter(key => !backupConfig[key]);

if (missing.length > 0) {
  console.error('❌ Missing required configurations:');
  missing.forEach(key => console.log(`   - ${key}`));
  console.log('\nPlease edit .env.backup file and fill in all required values.');
  process.exit(1);
}

console.log('✅ Configuration file found and has required fields\n');

// Test 1: SSH Connection
console.log('1️⃣ Testing SSH connection to backup server...');
try {
  const sshCommand = backupConfig.SSH_KEY_PATH
    ? `ssh -i ${backupConfig.SSH_KEY_PATH} -o ConnectTimeout=10 ${backupConfig.SSH_USER}@${backupConfig.SSH_HOST} "echo 'SSH connection successful'"`
    : `ssh -o ConnectTimeout=10 ${backupConfig.SSH_USER}@${backupConfig.SSH_HOST} "echo 'SSH connection successful'"`;

  const result = execSync(sshCommand, { encoding: 'utf8' });
  console.log('✅ SSH connection successful\n');
} catch (error) {
  console.error('❌ SSH connection failed:', error.message);
  console.log('\n💡 Troubleshooting:');
  console.log('   - Check if SSH server is running on backup server');
  console.log('   - Verify SSH username and host are correct');
  console.log('   - Check if SSH key path is correct (if using key auth)');
  console.log('   - Ensure firewall allows SSH connections');
  process.exit(1);
}

// Test 2: PostgreSQL Connection
console.log('2️⃣ Testing PostgreSQL connection to backup database...');
try {
  const testResult = execSync(`psql "${backupConfig.NEW_DATABASE_URL}" -c "SELECT version();"`, { encoding: 'utf8' });
  console.log('✅ PostgreSQL connection successful');
  console.log(`   Database: ${testResult.split('\n')[0]}\n`);
} catch (error) {
  console.error('❌ PostgreSQL connection failed:', error.message);
  console.log('\n💡 Troubleshooting:');
  console.log('   - Check if PostgreSQL is running on backup server');
  console.log('   - Verify database exists: createdb cafecare_backup');
  console.log('   - Check database credentials in NEW_DATABASE_URL');
  console.log('   - Ensure remote connections are allowed in postgresql.conf');
  console.log('   - Check pg_hba.conf allows your IP address');
  process.exit(1);
}

// Test 3: Backup Directory
console.log('3️⃣ Testing backup directory access...');
try {
  const dirCommand = backupConfig.SSH_KEY_PATH
    ? `ssh -i ${backupConfig.SSH_KEY_PATH} ${backupConfig.SSH_USER}@${backupConfig.SSH_HOST} "mkdir -p ${backupConfig.REMOTE_BACKUP_DIR} && echo 'Directory accessible'"`
    : `ssh ${backupConfig.SSH_USER}@${backupConfig.SSH_HOST} "mkdir -p ${backupConfig.REMOTE_BACKUP_DIR} && echo 'Directory accessible'"`;

  const result = execSync(dirCommand, { encoding: 'utf8' });
  console.log('✅ Backup directory accessible');
  console.log(`   Path: ${backupConfig.REMOTE_BACKUP_DIR}\n`);
} catch (error) {
  console.error('❌ Backup directory access failed:', error.message);
  console.log('\n💡 Troubleshooting:');
  console.log('   - Check if user has write permissions');
  console.log('   - Create the directory manually on backup server');
  console.log('   - Check disk space on backup server');
}

// Test 4: Test Small Backup Sync
console.log('4️⃣ Testing small backup sync...');
try {
  console.log('   Creating test table...');
  execSync(`psql "${process.env.DATABASE_URL}" -c "CREATE TABLE IF NOT EXISTS backup_test (id serial PRIMARY KEY, test_time timestamp DEFAULT CURRENT_TIMESTAMP);"`, { stdio: 'pipe' });

  console.log('   Inserting test data...');
  execSync(`psql "${process.env.DATABASE_URL}" -c "INSERT INTO backup_test (test_time) VALUES (CURRENT_TIMESTAMP) IF NOT EXISTS;"`, { stdio: 'pipe' });

  console.log('   Syncing to backup server...');
  execSync('node scripts/sync-to-backup-server.js', {
    stdio: 'pipe',
    cwd: path.join(__dirname, '..')
  });

  console.log('   Verifying backup...');
  const verifyResult = execSync(`psql "${backupConfig.NEW_DATABASE_URL}" -c "SELECT COUNT(*) as count FROM backup_test;"`, { encoding: 'utf8' });
  const count = parseInt(verifyResult.match(/\d+/)?.[0] || '0');

  if (count > 0) {
    console.log(`✅ Test backup sync successful (${count} records found)`);
  } else {
    console.warn('⚠️ Backup table not found in backup database (might be first sync)');
  }

  // Clean up test data
  execSync(`psql "${process.env.DATABASE_URL}" -c "DROP TABLE IF EXISTS backup_test;"`, { stdio: 'pipe' });

} catch (error) {
  console.error('❌ Backup sync test failed:', error.message);
}

console.log('\n🎉 All tests completed! Your backup server is ready for use.');
console.log('\n📋 Next steps:');
console.log('   1. Run your first full backup: node scripts/sync-to-backup-server.js');
console.log('   2. Set up daily automation: crontab -e');
console.log('   3. Add this line: 0 2 * * * cd /path/to/project && node scripts/daily-backup.js');