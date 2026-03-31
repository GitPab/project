#!/usr/bin/env node
/**
 * MySQL Connection Diagnostic Tool
 * Run this to check all common issues with MySQL connection
 */

import mysql from 'mysql2/promise';
import net from 'net';

console.log('========================================');
console.log('   MySQL Connection Diagnostics');
console.log('========================================\n');

// Check 1: Environment Variables
console.log('✓ CHECK 1: Environment Variables');
console.log('  DB_TYPE:', process.env.DB_TYPE || '(not set - defaults to postgresql)');
console.log('  MYSQL_HOST:', process.env.MYSQL_HOST || '(not set - defaults to localhost)');
console.log('  MYSQL_PORT:', process.env.MYSQL_PORT || '(not set - defaults to 3306)');
console.log('  MYSQL_USER:', process.env.MYSQL_USER || '(not set - defaults to root)');
console.log('  MYSQL_PASSWORD:', process.env.MYSQL_PASSWORD ? '***SET***' : '(not set - empty password)');
console.log('  MYSQL_DATABASE:', process.env.MYSQL_DATABASE || '(not set - defaults to sacma)');
console.log('  PORT:', process.env.PORT || '(not set - defaults to 3001)');
console.log();

// Check 2: Port Availability
console.log('✓ CHECK 2: Port Availability');
async function checkPort(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.close();
        resolve(true);
      })
      .listen(port);
  });
}

const ports = [3001, 3002, 3003, 3004, 3306];
for (const port of ports) {
  const available = await checkPort(port);
  console.log(`  Port ${port}: ${available ? '✅ Available' : '❌ In Use'}`);
}
console.log();

// Check 3: MySQL Connection
console.log('✓ CHECK 3: MySQL Connection');
const host = process.env.MYSQL_HOST || 'localhost';
const port = parseInt(process.env.MYSQL_PORT || '3306');
const user = process.env.MYSQL_USER || 'root';
const password = process.env.MYSQL_PASSWORD || '';
const database = process.env.MYSQL_DATABASE || 'sacma';

let connection = null;

try {
  // Try connecting without database first
  connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
  });
  console.log('  ✅ Connected to MySQL server (no database)');
  
  // Check if database exists
  const [rows] = await connection.execute(
    'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
    [database]
  );
  
  if (rows.length > 0) {
    console.log(`  ✅ Database '${database}' exists`);
  } else {
    console.log(`  ⚠️  Database '${database}' does NOT exist - will be created automatically`);
  }
  
  await connection.end();
  
  // Try connecting with database
  connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
  });
  
  const [tables] = await connection.execute('SHOW TABLES');
  console.log(`  ✅ Connected to database '${database}'`);
  console.log(`  📊 Tables found: ${tables.length}`);
  tables.forEach(t => console.log(`     - ${Object.values(t)[0]}`));
  
  await connection.end();
  console.log();
  console.log('========================================');
  console.log('   ✅ ALL CHECKS PASSED');
  console.log('   MySQL is ready! Start the server with:');
  console.log(`   $env:PORT="${process.env.PORT || '3001'}"; node server.js`);
  console.log('========================================');
  
} catch (error) {
  console.log('  ❌ Connection failed:', error.message);
  console.log();
  console.log('========================================');
  console.log('   ❌ CHECKS FAILED');
  console.log('========================================');
  
  if (error.message.includes('ECONNREFUSED')) {
    console.log('\n🔧 FIX: MySQL server is not running');
    console.log('   - Start XAMPP/WAMP/MySQL service');
    console.log('   - Or run: net start MySQL (Windows)');
  }
  
  if (error.message.includes('Access denied')) {
    console.log('\n🔧 FIX: Wrong password');
    console.log('   - Check your MySQL password in MySQL Workbench');
    console.log('   - Update: $env:MYSQL_PASSWORD="your_password"');
  }
  
  if (error.message.includes('Unknown database') && connection) {
    console.log('\n🔧 FIX: Database does not exist');
    console.log('   - The server will auto-create it on first run');
    console.log('   - Or manually create: CREATE DATABASE sacma;');
  }
  
  if (connection) {
    await connection.end().catch(() => {});
  }
  process.exit(1);
}
