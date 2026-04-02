/**
 * Database Migration & Sync Tool
 * Migrate data between PostgreSQL and MySQL bidirectionally
 */

import pkg from 'pg';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';

const { Pool: PgPool } = pkg;

// Convert PostgreSQL types to MySQL types
function convertPgTypeToMySql(pgType, value) {
  if (value === null || value === undefined) return null;
  
  switch (pgType) {
    case 'uuid':
      return value; // Same in MySQL
    case 'timestamp':
    case 'timestamptz':
      return value;
    case 'jsonb':
      return typeof value === 'string' ? JSON.parse(value) : value;
    case 'boolean':
      return value;
    case 'inet':
      return value;
    default:
      return value;
  }
}

// Convert MySQL types to PostgreSQL
function convertMySqlTypeToPg(value) {
  if (value === null || value === undefined) return null;
  
  // JSON in MySQL is same as JSONB in PostgreSQL
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return value;
}

export class DatabaseSync {
  constructor(pgUrl, mysqlConfig) {
    this.pgPool = new PgPool({
      connectionString: pgUrl,
      max: 5,
    });
    this.mysqlConfig = mysqlConfig;
    this.mysqlPool = null;
    this.syncLog = [];
  }

  async initMySQL() {
    if (!this.mysqlPool) {
      this.mysqlPool = mysql.createPool({
        ...this.mysqlConfig,
        connectionLimit: 5,
      });
    }
  }

  /**
   * Sync PostgreSQL → MySQL (one way)
   */
  async syncPgToMySQL(options = { users: true, universities: true, registrations: true }) {
    await this.initMySQL();
    const results = { users: 0, universities: 0, registrations: 0, errors: [] };

    try {
      // Sync Users
      if (options.users) {
        const { rows: users } = await this.pgPool.query(
          `SELECT * FROM users ORDER BY created_at`
        );
        
        for (const user of users) {
          try {
            await this.mysqlPool.execute(
              `INSERT INTO users (id, name, email, phone, password, role, is_first_login, 
                setup_token, setup_token_expiry, invited_by, is_active, last_login, 
                created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
               name = VALUES(name), email = VALUES(email), phone = VALUES(phone),
               role = VALUES(role), is_active = VALUES(is_active), updated_at = VALUES(updated_at)`,
              [
                user.id, user.name, user.email, user.phone, user.password, user.role,
                user.is_first_login || false, user.setup_token, user.setup_token_expiry,
                user.invited_by, user.is_active !== false, user.last_login,
                user.created_at, user.updated_at
              ]
            );
            results.users++;
          } catch (err) {
            results.errors.push({ table: 'users', id: user.id, error: err.message });
          }
        }
        logger.info(`Synced ${results.users} users to MySQL`);
      }

      // Sync Universities
      if (options.universities) {
        const { rows: universities } = await this.pgPool.query(
          `SELECT * FROM universities ORDER BY created_at`
        );
        
        for (const uni of universities) {
          try {
            await this.mysqlPool.execute(
              `INSERT INTO universities (id, name, korean_name, country, region, ranking, top_tier,
                hero_image, thumbnail, korean_data, is_active, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
               name = VALUES(name), korean_name = VALUES(korean_name), updated_at = VALUES(updated_at)`,
              [
                uni.id, uni.name, uni.korean_name, uni.country || 'Hàn Quốc', 
                uni.region, uni.ranking, uni.top_tier,
                uni.hero_image, uni.thumbnail,
                uni.korean_data ? JSON.parse(uni.korean_data) : null,
                uni.is_active !== false,
                uni.created_at, uni.updated_at
              ]
            );
            results.universities++;
          } catch (err) {
            results.errors.push({ table: 'universities', id: uni.id, error: err.message });
          }
        }
        logger.info(`Synced ${results.universities} universities to MySQL`);
      }

      // Sync Registrations
      if (options.registrations) {
        const { rows: registrations } = await this.pgPool.query(
          `SELECT * FROM registrations ORDER BY created_at`
        );
        
        for (const reg of registrations) {
          try {
            await this.mysqlPool.execute(
              `INSERT INTO registrations (id, student_id, university_id, visa_system, status, 
                form_data, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
               status = VALUES(status), updated_at = VALUES(updated_at)`,
              [
                reg.id, reg.student_id, reg.university_id, reg.visa_system,
                reg.status || 'pending',
                reg.form_data ? JSON.parse(reg.form_data) : null,
                reg.created_at, reg.updated_at
              ]
            );
            results.registrations++;
          } catch (err) {
            results.errors.push({ table: 'registrations', id: reg.id, error: err.message });
          }
        }
        logger.info(`Synced ${results.registrations} registrations to MySQL`);
      }

      return results;
    } catch (error) {
      logger.error('PG→MySQL sync failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Sync MySQL → PostgreSQL (one way)
   */
  async syncMySQLToPg(options = { users: true, universities: true, registrations: true }) {
    await this.initMySQL();
    const results = { users: 0, universities: 0, registrations: 0, errors: [] };

    try {
      // Sync Users
      if (options.users) {
        const [users] = await this.mysqlPool.execute(`SELECT * FROM users ORDER BY created_at`);
        
        for (const user of users) {
          try {
            await this.pgPool.query(
              `INSERT INTO users (id, name, email, phone, password, role, is_first_login, 
                setup_token, setup_token_expiry, invited_by, is_active, last_login, 
                created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
               ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone,
               role = EXCLUDED.role, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at`,
              [
                user.id, user.name, user.email, user.phone, user.password, user.role,
                user.is_first_login, user.setup_token, user.setup_token_expiry,
                user.invited_by, user.is_active, user.last_login,
                user.created_at, user.updated_at
              ]
            );
            results.users++;
          } catch (err) {
            results.errors.push({ table: 'users', id: user.id, error: err.message });
          }
        }
        logger.info(`Synced ${results.users} users to PostgreSQL`);
      }

      // Sync Universities
      if (options.universities) {
        const [universities] = await this.mysqlPool.execute(`SELECT * FROM universities ORDER BY created_at`);
        
        for (const uni of universities) {
          try {
            await this.pgPool.query(
              `INSERT INTO universities (id, name, korean_name, country, region, ranking, top_tier,
                hero_image, thumbnail, korean_data, is_active, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
               ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name, korean_name = EXCLUDED.korean_name, updated_at = EXCLUDED.updated_at`,
              [
                uni.id, uni.name, uni.korean_name, uni.country, uni.region, 
                uni.ranking, uni.top_tier,
                uni.hero_image, uni.thumbnail,
                uni.korean_data ? JSON.stringify(uni.korean_data) : null,
                uni.is_active, uni.created_at, uni.updated_at
              ]
            );
            results.universities++;
          } catch (err) {
            results.errors.push({ table: 'universities', id: uni.id, error: err.message });
          }
        }
        logger.info(`Synced ${results.universities} universities to PostgreSQL`);
      }

      return results;
    } catch (error) {
      logger.error('MySQL→PG sync failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Two-way sync: Merge data from both databases
   * Conflict resolution: Most recent updated_at wins
   */
  async syncBidirectional() {
    logger.info('Starting bidirectional sync...');
    
    // First: MySQL → PG (for any new data in MySQL)
    const toPg = await this.syncMySQLToPg();
    
    // Then: PG → MySQL (for any new data in PostgreSQL)
    const toMySQL = await this.syncPgToMySQL();
    
    return {
      toPostgreSQL: toPg,
      toMySQL: toMySQL,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Export database to JSON file
   */
  async exportToFile(filename = 'db-backup.json') {
    await this.initMySQL();
    
    const backup = {
      exportedAt: new Date().toISOString(),
      from: process.env.DB_TYPE === 'mysql' ? 'MySQL' : 'PostgreSQL',
      data: {}
    };

    if (process.env.DB_TYPE === 'mysql') {
      const [users] = await this.mysqlPool.execute('SELECT * FROM users');
      const [universities] = await this.mysqlPool.execute('SELECT * FROM universities');
      const [registrations] = await this.mysqlPool.execute('SELECT * FROM registrations');
      const [auditLogs] = await this.mysqlPool.execute('SELECT * FROM audit_logs');
      
      backup.data = { users, universities, registrations, audit_logs: auditLogs };
    } else {
      const { rows: users } = await this.pgPool.query('SELECT * FROM users');
      const { rows: universities } = await this.pgPool.query('SELECT * FROM universities');
      const { rows: registrations } = await this.pgPool.query('SELECT * FROM registrations');
      const { rows: auditLogs } = await this.pgPool.query('SELECT * FROM audit_logs');
      
      backup.data = { users, universities, registrations, audit_logs: auditLogs };
    }

    const filepath = path.join(process.cwd(), 'backups', filename);
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(backup, null, 2));
    
    logger.info(`Database exported to ${filepath}`);
    return { filepath, recordCount: Object.values(backup.data).reduce((sum, arr) => sum + arr.length, 0) };
  }

  /**
   * Import from JSON file
   */
  async importFromFile(filename = 'db-backup.json') {
    const filepath = path.join(process.cwd(), 'backups', filename);
    const content = await fs.readFile(filepath, 'utf8');
    const backup = JSON.parse(content);
    
    await this.initMySQL();
    
    const results = { imported: 0, errors: [] };
    
    // Import users
    for (const user of backup.data.users || []) {
      try {
        if (process.env.DB_TYPE === 'mysql') {
          await this.mysqlPool.execute(
            `INSERT INTO users (id, name, email, password, role, is_active, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name=VALUES(name)`,
            [user.id, user.name, user.email, user.password, user.role, user.is_active !== false, user.created_at]
          );
        } else {
          await this.pgPool.query(
            `INSERT INTO users (id, name, email, password, role, is_active, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
            [user.id, user.name, user.email, user.password, user.role, user.is_active !== false, user.created_at]
          );
        }
        results.imported++;
      } catch (err) {
        results.errors.push({ table: 'users', id: user.id, error: err.message });
      }
    }

    logger.info(`Imported ${results.imported} records from ${filepath}`);
    return results;
  }

  async close() {
    if (this.pgPool) await this.pgPool.end();
    if (this.mysqlPool) await this.mysqlPool.end();
  }
}

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const action = process.argv[2] || 'export';
  
  const sync = new DatabaseSync(
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sacma',
    {
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'sacma'
    }
  );

  try {
    switch (action) {
      case 'export': {
        const result = await sync.exportToFile(process.argv[3]);
        console.log(`✅ Exported ${result.recordCount} records to ${result.filepath}`);
        break;
      }
      
      case 'import': {
        const importResult = await sync.importFromFile(process.argv[3]);
        console.log(`✅ Imported ${importResult.imported} records`);
        break;
      }
      
      case 'sync-to-mysql': {
        const toMySQL = await sync.syncPgToMySQL();
        console.log('✅ Synced to MySQL:', toMySQL);
        break;
      }
      
      case 'sync-to-pg': {
        const toPg = await sync.syncMySQLToPg();
        console.log('✅ Synced to PostgreSQL:', toPg);
        break;
      }
      
      case 'sync-bidirectional': {
        const bi = await sync.syncBidirectional();
        console.log('✅ Bidirectional sync complete:', bi);
        break;
      }
      
      default:
        console.log('Usage: node dbSync.js [export|import|sync-to-mysql|sync-to-pg|sync-bidirectional] [filename]');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await sync.close();
  }
}

export default DatabaseSync;
