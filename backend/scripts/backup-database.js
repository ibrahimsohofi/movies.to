#!/usr/bin/env node

/**
 * Database Backup Script
 *
 * This script creates automated backups of the database
 * Supports both SQLite and MySQL databases
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
const DB_TYPE = process.env.DB_TYPE || 'sqlite'; // 'sqlite' or 'mysql'
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '7'); // Keep last 7 backups

// Database configuration
const SQLITE_DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database.sqlite');
const MYSQL_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
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
  const extension = DB_TYPE === 'sqlite' ? 'sqlite' : 'sql';
  return `backup_${timestamp}.${extension}`;
}

/**
 * Backup SQLite database
 */
function backupSQLite() {
  console.log('🔄 Starting SQLite backup...');

  if (!fs.existsSync(SQLITE_DB_PATH)) {
    throw new Error(`SQLite database not found: ${SQLITE_DB_PATH}`);
  }

  const backupFile = path.join(BACKUP_DIR, getBackupFilename());

  try {
    // Copy database file
    fs.copyFileSync(SQLITE_DB_PATH, backupFile);

    // Verify backup
    const stats = fs.statSync(backupFile);
    console.log(`✅ SQLite backup created: ${backupFile} (${(stats.size / 1024).toFixed(2)} KB)`);

    return backupFile;
  } catch (error) {
    throw new Error(`SQLite backup failed: ${error.message}`);
  }
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
      `-u${MYSQL_CONFIG.user}`,
      MYSQL_CONFIG.password ? `-p${MYSQL_CONFIG.password}` : '',
      '--single-transaction',
      '--quick',
      '--lock-tables=false',
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

  // Example implementations:

  // AWS S3:
  // const AWS = require('aws-sdk');
  // const s3 = new AWS.S3();
  // const fileContent = fs.readFileSync(backupFile);
  // await s3.upload({
  //   Bucket: process.env.S3_BUCKET,
  //   Key: path.basename(backupFile),
  //   Body: fileContent
  // }).promise();

  // Google Cloud Storage:
  // const { Storage } = require('@google-cloud/storage');
  // const storage = new Storage();
  // await storage.bucket(process.env.GCS_BUCKET).upload(backupFile);

  // Backblaze B2, DigitalOcean Spaces, etc. can be added similarly
}

/**
 * Send notification (optional)
 */
function sendNotification(success, message) {
  console.log(`📧 Notification not configured`);

  // Example: Send email via SendGrid, Resend, etc.
  // Example: Send Slack notification
  // Example: Send Discord webhook
}

/**
 * Main backup function
 */
async function performBackup() {
  const startTime = Date.now();

  console.log('========================================');
  console.log('🎬 Movies.to Database Backup');
  console.log(`📅 ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  console.log(`💾 Database Type: ${DB_TYPE}`);
  console.log('========================================\n');

  try {
    // Ensure backup directory exists
    ensureBackupDir();

    // Perform backup based on database type
    let backupFile;
    if (DB_TYPE === 'sqlite') {
      backupFile = backupSQLite();
    } else if (DB_TYPE === 'mysql') {
      backupFile = backupMySQL();
    } else {
      throw new Error(`Unsupported database type: ${DB_TYPE}`);
    }

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
