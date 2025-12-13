import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create SQLite database
const dbPath = process.env.DB_PATH || join(__dirname, '../../database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Test connection
export function testConnection() {
  try {
    const result = db.prepare('SELECT 1').get();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Helper to convert MySQL-style queries to SQLite and execute
export function query(sql, params = []) {
  try {
    if (sql.trim().toLowerCase().startsWith('select')) {
      return db.prepare(sql).all(...params);
    }
    return db.prepare(sql).run(...params);
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
}

// Async wrapper for compatibility with existing controllers
export async function execute(sql, params = []) {
  return query(sql, params);
}

export default db;
