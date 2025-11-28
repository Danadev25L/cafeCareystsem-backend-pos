#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🚀 Setting up backup database server configuration...\n');

// New server configuration template
const newServerConfig = {
  // Database Configuration
  NEW_DATABASE_URL: '', // User will fill this
  NEW_SERVER_IP: '',    // User will fill this
  NEW_SERVER_PORT: '5432',
  NEW_DB_NAME: 'cafecare_backup',
  NEW_DB_USER: 'postgres',
  NEW_DB_PASSWORD: '',  // User will fill this

  // SSH Configuration (for remote access)
  SSH_USER: '',         // User will fill this
  SSH_HOST: '',         // User will fill this
  SSH_PORT: '22',
  SSH_KEY_PATH: '',     // User will fill this

  // Backup Configuration
  BACKUP_SCHEDULE: '0 2 * * *', // Daily at 2 AM
  BACKUP_RETENTION_DAYS: '7',
  REMOTE_BACKUP_DIR: '/var/backups/cafecare'
};

// Create new environment file for backup server
const backupEnvFile = path.join(__dirname, '../.env.backup');
const envContent = Object.entries(newServerConfig)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

try {
  fs.writeFileSync(backupEnvFile, envContent);
  console.log('✅ Created backup environment file: .env.backup');
} catch (error) {
  console.error('❌ Error creating backup env file:', error.message);
}

console.log('\n📋 To complete the setup, you need to:');

console.log('\n1️⃣ **SET UP NEW POSTGRESQL SERVER:**');
console.log('   - Install PostgreSQL 14+ on new server');
console.log('   - Create database: createdb cafecare_backup');
console.log('   - Enable remote connections in postgresql.conf');
console.log('   - Configure pg_hba.conf for your IP');

console.log('\n2️⃣ **EDIT .env.backup FILE:**');
console.log('   Fill in these values:');
console.log(`   NEW_DATABASE_URL=postgresql://username:password@new-server-ip:5432/cafecare_backup`);
console.log(`   NEW_SERVER_IP=your-new-server-ip`);
console.log(`   NEW_DB_PASSWORD=your-database-password`);
console.log(`   SSH_USER=your-server-username`);
console.log(`   SSH_HOST=your-new-server-ip`);
console.log(`   SSH_KEY_PATH=/path/to/your/ssh-key`);

console.log('\n3️⃣ **TEST CONNECTION:**');
console.log('   node test-backup-connection.js');

console.log('\n4️⃣ **RUN INITIAL BACKUP:**');
console.log('   node backup-database.js');
console.log('   node sync-to-backup-server.js');

console.log('\n5️⃣ **SET UP AUTOMATION:**');
console.log('   Add to crontab: 0 2 * * * cd /path/to/project && node scripts/daily-backup.js');

console.log('\n🔧 **Commands to install PostgreSQL on Ubuntu:**');
console.log('   sudo apt update');
console.log('   sudo apt install postgresql postgresql-contrib');
console.log('   sudo systemctl start postgresql');
console.log('   sudo systemctl enable postgresql');
console.log('   sudo -u postgres createdb cafecare_backup');

console.log('\n🔧 **Commands to install PostgreSQL on CentOS:**');
console.log('   sudo yum install postgresql-server postgresql-contrib');
console.log('   sudo postgresql-setup initdb');
console.log('   sudo systemctl start postgresql');
console.log('   sudo systemctl enable postgresql');
console.log('   sudo -u postgres createdb cafecare_backup');

console.log('\n⚠️ **SECURITY NOTES:**');
console.log('   - Use strong passwords');
console.log('   - Configure firewall to only allow your IP');
console.log('   - Use SSH key authentication');
console.log('   - Enable SSL for database connections');
console.log('   - Regular security updates');

console.log('\n🎯 **NEXT STEPS:**');
console.log('1. Set up the new PostgreSQL server');
console.log('2. Fill in the .env.backup file with your server details');
console.log('3. Test the connection with: node test-backup-connection.js');
console.log('4. Run your first backup');