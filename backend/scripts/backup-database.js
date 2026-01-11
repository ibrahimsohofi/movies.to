#!/usr/bin/env node

/**
 * Database Backup Script
 *
 * This script creates automated backups of the MySQL database
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '7'); // Keep last 7 backups

// MySQL Database configuration
const MYSQL_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '3306',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'movies_to',
};

/**
 * Ensure backup directory exists
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`✅ Created backup directory: ${BACKUP_DIR}`);
  }
}

/**
 * Generate backup filename with timestamp
 */
function getBackupFilename() {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  return `backup_${timestamp}.sql`;
}

/**
 * Backup MySQL database
 */
function backupMySQL() {
  console.log('🔄 Starting MySQL backup...');

  const backupFile = path.join(BACKUP_DIR, getBackupFilename());

  try {
    // Build mysqldump command
    const cmd = [
      'mysqldump',
      `-h${MYSQL_CONFIG.host}`,
      `-P${MYSQL_CONFIG.port}`,
      `-u${MYSQL_CONFIG.user}`,
      MYSQL_CONFIG.password ? `-p${MYSQL_CONFIG.password}` : '',
      '--single-transaction',
      '--quick',
      '--lock-tables=false',
      '--routines',
      '--triggers',
      MYSQL_CONFIG.database,
      `> "${backupFile}"`
    ].filter(Boolean).join(' ');

    // Execute mysqldump
    execSync(cmd, { stdio: 'inherit', shell: true });

    // Verify backup
    const stats = fs.statSync(backupFile);
    console.log(`✅ MySQL backup created: ${backupFile} (${(stats.size / 1024).toFixed(2)} KB)`);

    return backupFile;
  } catch (error) {
    throw new Error(`MySQL backup failed: ${error.message}`);
  }
}

/**
 * Compress backup file (optional)
 */
function compressBackup(backupFile) {
  console.log('🔄 Compressing backup...');

  try {
    const gzipFile = `${backupFile}.gz`;
    execSync(`gzip -f "${backupFile}"`, { stdio: 'inherit' });

    const stats = fs.statSync(gzipFile);
    console.log(`✅ Backup compressed: ${gzipFile} (${(stats.size / 1024).toFixed(2)} KB)`);

    return gzipFile;
  } catch (error) {
    console.warn(`⚠️  Compression failed: ${error.message}`);
    return backupFile;
  }
}

/**
 * Clean old backups (keep only MAX_BACKUPS)
 */
function cleanOldBackups() {
  console.log('🔄 Cleaning old backups...');

  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup_'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Sort by newest first

    // Keep only MAX_BACKUPS newest files
    const toDelete = files.slice(MAX_BACKUPS);

    if (toDelete.length > 0) {
      toDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Deleted old backup: ${file.name}`);
      });
      console.log(`✅ Cleaned ${toDelete.length} old backup(s)`);
    } else {
      console.log('✅ No old backups to clean');
    }
  } catch (error) {
    console.warn(`⚠️  Cleanup failed: ${error.message}`);
  }
}

/**
 * Upload backup to cloud storage (optional)
 * Implement this based on your cloud provider
 */
function uploadToCloud(backupFile) {
  console.log('📤 Cloud upload not configured (implement uploadToCloud function)');
}

/**
 * Send notification (optional)
 */
function sendNotification(success, message) {
  console.log(`📧 Notification not configured`);
}

/**
 * Main backup function
 */
async function performBackup() {
  const startTime = Date.now();

  console.log('========================================');
  console.log('🎬 Movies.to Database Backup');
  console.log(`📅 ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  console.log(`💾 Database: MySQL (${MYSQL_CONFIG.database}@${MYSQL_CONFIG.host}:${MYSQL_CONFIG.port})`);
  console.log('========================================\n');

  try {
    // Ensure backup directory exists
    ensureBackupDir();

    // Perform MySQL backup
    let backupFile = backupMySQL();

    // Optional: Compress backup
    if (process.env.COMPRESS_BACKUP === 'true') {
      backupFile = compressBackup(backupFile);
    }

    // Optional: Upload to cloud
    if (process.env.UPLOAD_TO_CLOUD === 'true') {
      uploadToCloud(backupFile);
    }

    // Clean old backups
    cleanOldBackups();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Backup completed successfully in ${duration}s`);
    console.log('========================================\n');

    sendNotification(true, 'Backup completed successfully');
    process.exit(0);

  } catch (error) {
    console.error(`\n❌ Backup failed: ${error.message}`);
    console.error(error.stack);
    console.log('========================================\n');

    sendNotification(false, `Backup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run backup if called directly
if (require.main === module) {
  performBackup();
}

module.exports = { performBackup };
