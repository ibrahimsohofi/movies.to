import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

// MySQL configuration only
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'movies_to',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ MySQL database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MySQL database connection failed:', error.message);
    console.log('📌 Make sure MySQL is running and credentials are correct in .env file');
    return false;
  }
}

// Execute query (returns rows)
export async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
}

// Execute query (returns result metadata)
export async function execute(sql, params = []) {
  try {
    const [result] = await pool.execute(sql, params);
    return result;
  } catch (error) {
    console.error('Database execute error:', error.message);
    throw error;
  }
}

// Get connection from pool
export async function getConnection() {
  return await pool.getConnection();
}

// Export pool as db for backward compatibility
export { pool as db };
export default pool;
