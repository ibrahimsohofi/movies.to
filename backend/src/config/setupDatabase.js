import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupDatabase() {
  let connection;

  try {
    console.log('🗄️  Setting up MySQL database...\n');

    // Connect to MySQL server (without database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'movies_to';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database "${dbName}" created/verified`);

    // Use the database
    await connection.query(`USE \`${dbName}\``);
    console.log(`✅ Using database "${dbName}"`);

    // Read and execute schema
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Split schema by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        await connection.query(statement);
      } catch (err) {
        // Ignore duplicate key errors from INSERT statements
        if (!err.message.includes('Duplicate entry')) {
          throw err;
        }
      }
    }

    console.log('✅ All tables created successfully');
    console.log('✅ Default data inserted');

    console.log('\n📊 Database Information:');
    console.log(`   Type: MySQL`);
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || 3306}`);
    console.log(`   Database: ${dbName}`);
    console.log('\n✨ Database setup completed successfully!');
    console.log('🎯 Ready to use with your application!\n');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\n📝 Make sure:');
    console.error('   1. MySQL server is running');
    console.error('   2. Credentials in .env file are correct');
    console.error('   3. User has permissions to create databases\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
