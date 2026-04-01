/**
 * Database Optimization Tool
 * Analyze queries, add indexes, optimize tables
 */

import { getPool } from './dbAdapter.js';
import { logger } from './logger.js';

export class DatabaseOptimizer {
  constructor() {
    this.recommendations = [];
  }

  /**
   * Get all table statistics
   */
  async getTableStats() {
    const pool = await getPool();
    const DB_TYPE = process.env.DB_TYPE || 'postgresql';
    
    try {
      if (DB_TYPE === 'mysql') {
        const [tables] = await pool.execute(`
          SELECT 
            table_name,
            table_rows,
            data_length,
            index_length,
            (data_length + index_length) as total_size
          FROM information_schema.tables
          WHERE table_schema = DATABASE()
          AND table_type = 'BASE TABLE'
        `);
        return tables;
      } else {
        const { rows } = await pool.query(`
          SELECT 
            schemaname,
            relname as tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_tuples
          FROM pg_stat_user_tables
          ORDER BY n_live_tup DESC
        `);
        return rows;
      }
    } catch (err) {
      logger.warn('Failed to load table stats', { error: err.message });
      return [];
    }
  }

  /**
   * Find missing indexes based on slow queries
   */
  async analyzeMissingIndexes() {
    const pool = await getPool();
    const DB_TYPE = process.env.DB_TYPE || 'postgresql';
    const recommendations = [];

    try {
      if (DB_TYPE === 'mysql') {
      // Check for columns without indexes that are used in WHERE
      const [missingIndexes] = await pool.execute(`
        SELECT 
          table_name,
          column_name,
          cardinality
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
        AND non_unique = 1
        AND cardinality < 100
      `);

      // Common query patterns that need indexes
      const commonQueries = [
        { table: 'users', column: 'email', reason: 'Login queries' },
        { table: 'users', column: 'role', reason: 'Role-based access' },
        { table: 'users', column: 'is_active', reason: 'Active user filtering' },
        { table: 'universities', column: 'name', reason: 'Search queries' },
        { table: 'universities', column: 'is_active', reason: 'Active filtering' },
        { table: 'registrations', column: 'student_id', reason: 'Student lookups' },
        { table: 'registrations', column: 'university_id', reason: 'University lookups' },
        { table: 'audit_logs', column: 'entity_type', reason: 'Audit filtering' },
        { table: 'audit_logs', column: 'created_at', reason: 'Date range queries' },
      ];

      for (const query of commonQueries) {
        const [exists] = await pool.execute(`
          SELECT 1 FROM information_schema.statistics
          WHERE table_schema = DATABASE()
          AND table_name = ?
          AND column_name = ?
          LIMIT 1
        `, [query.table, query.column]);

        if (exists.length === 0) {
          recommendations.push({
            type: 'CREATE_INDEX',
            priority: 'HIGH',
            table: query.table,
            column: query.column,
            reason: query.reason,
            sql: `CREATE INDEX idx_${query.table}_${query.column} ON ${query.table}(${query.column});`
          });
        }
      }
      } else {
      // PostgreSQL missing index detection
      const { rows } = await pool.query(`
        SELECT
          s.schemaname,
          s.tablename,
          s.attname as column_name,
          t.seq_tup_read,
          t.idx_tup_fetch
        FROM pg_stats s
        JOIN pg_stat_user_tables t
          ON s.tablename = t.relname
         AND s.schemaname = t.schemaname
        WHERE s.schemaname = 'public'
        AND t.seq_tup_read > 1000
        AND NOT EXISTS (
          SELECT 1 FROM pg_indexes i
          WHERE i.tablename = s.tablename
          AND i.indexdef ILIKE '%' || s.attname || '%'
        )
      `);

        for (const row of rows) {
        recommendations.push({
          type: 'CREATE_INDEX',
          priority: 'MEDIUM',
          table: row.tablename,
          column: row.column_name,
          reason: `High sequential reads: ${row.seq_tup_read} reads`,
          sql: `CREATE INDEX IF NOT EXISTS idx_${row.tablename}_${row.column_name} ON ${row.tablename}(${row.column_name});`
        });
        }
      }
    } catch (err) {
      logger.warn('Missing index analysis failed', { error: err.message });
      return [];
    }

    return recommendations;
  }

  /**
   * Apply recommended indexes
   */
  async applyIndexes(recommendations) {
    const pool = await getPool();
    const results = { applied: 0, failed: [] };

    for (const rec of recommendations) {
      if (rec.type === 'CREATE_INDEX') {
        try {
          await pool.query(rec.sql);
          logger.info(`Created index: ${rec.table}.${rec.column}`);
          results.applied++;
        } catch (err) {
          results.failed.push({ sql: rec.sql, error: err.message });
        }
      }
    }

    return results;
  }

  /**
   * Optimize tables (MySQL: ANALYZE/OPTIMIZE, PG: VACUUM/ANALYZE)
   */
  async optimizeTables() {
    const pool = await getPool();
    const DB_TYPE = process.env.DB_TYPE || 'postgresql';
    const results = { optimized: [], errors: [] };

    const tables = ['users', 'universities', 'registrations', 'audit_logs'];

    for (const table of tables) {
      try {
        if (DB_TYPE === 'mysql') {
          await pool.execute(`ANALYZE TABLE ${table}`);
          await pool.execute(`OPTIMIZE TABLE ${table}`);
        } else {
          await pool.query(`ANALYZE ${table}`);
          // VACUUM requires special permissions, skip if fails
          try {
            await pool.query(`VACUUM ${table}`);
          } catch (e) {
            // VACUUM might not be allowed, that's ok
          }
        }
        results.optimized.push(table);
        logger.info(`Optimized table: ${table}`);
      } catch (err) {
        results.errors.push({ table, error: err.message });
      }
    }

    return results;
  }

  /**
   * Get slow query recommendations
   */
  async getQueryOptimizationTips() {
    const tips = [
      {
        type: 'QUERY_PATTERN',
        priority: 'HIGH',
        description: 'Use SELECT specific columns instead of SELECT *',
        example: 'SELECT id, name, email FROM users',
        benefit: 'Reduces memory usage and network traffic'
      },
      {
        type: 'QUERY_PATTERN',
        priority: 'HIGH',
        description: 'Add LIMIT to queries that return many rows',
        example: 'SELECT * FROM users LIMIT 100',
        benefit: 'Prevents memory exhaustion'
      },
      {
        type: 'INDEX_USAGE',
        priority: 'MEDIUM',
        description: 'Use EXPLAIN to check if queries use indexes',
        example: 'EXPLAIN SELECT * FROM users WHERE email = \'test@test.com\'',
        benefit: 'Identifies missing indexes'
      },
      {
        type: 'CACHING',
        priority: 'MEDIUM',
        description: 'Enable Redis caching for frequently accessed data',
        benefit: 'Reduces database load by 80%'
      },
      {
        type: 'PAGINATION',
        priority: 'HIGH',
        description: 'Use cursor/keyset pagination instead of OFFSET',
        example: 'WHERE id > last_id ORDER BY id LIMIT 20',
        benefit: 'Faster pagination on large datasets'
      }
    ];

    return tips;
  }

  /**
   * Full optimization run
   */
  async runFullOptimization() {
    logger.info('Starting database optimization...');
    
    const report = {
      timestamp: new Date().toISOString(),
      database: process.env.DB_TYPE || 'postgresql',
      tables: await this.getTableStats(),
      missingIndexes: await this.analyzeMissingIndexes(),
      appliedIndexes: null,
      optimizationResults: null,
      tips: await this.getQueryOptimizationTips()
    };

    // Apply missing indexes
    if (report.missingIndexes.length > 0) {
      report.appliedIndexes = await this.applyIndexes(report.missingIndexes);
    }

    // Optimize tables
    report.optimizationResults = await this.optimizeTables();

    logger.info('Database optimization complete');
    return report;
  }
}

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new DatabaseOptimizer();
  
  try {
    const report = await optimizer.runFullOptimization();
    console.log('\n========================================');
    console.log('   Database Optimization Report');
    console.log('========================================\n');
    
    console.log('📊 Table Statistics:');
    report.tables.forEach(t => {
      console.log(`  ${t.table_name || t.tablename}: ${t.table_rows || t.live_tuples || 'N/A'} rows`);
    });
    
    console.log('\n🔍 Missing Indexes Found:', report.missingIndexes.length);
    report.missingIndexes.forEach(idx => {
      console.log(`  ⚠️  ${idx.table}.${idx.column} - ${idx.reason}`);
    });
    
    if (report.appliedIndexes) {
      console.log('\n✅ Indexes Applied:', report.appliedIndexes.applied);
      if (report.appliedIndexes.failed.length > 0) {
        console.log('❌ Failed:', report.appliedIndexes.failed.length);
      }
    }
    
    console.log('\n💡 Optimization Tips:');
    report.tips.forEach(tip => {
      console.log(`  ${tip.priority}: ${tip.description}`);
    });
    
    console.log('\n========================================');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

export default DatabaseOptimizer;
