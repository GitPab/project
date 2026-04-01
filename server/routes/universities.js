/**
 * University Routes
 * CRUD operations for universities with caching and soft delete
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../dbAdapter.js';
import { logger } from '../logger.js';
import { cacheMiddleware, cache } from '../cache.js';
import { logAudit } from '../utils/audit.js';
import { requirePermission } from '../utils/rbac.js';

const router = express.Router();

// Invalidate university cache helper
async function invalidateUniversityCache() {
  await cache.invalidateUniversities();
}

/**
 * GET /api/universities
 * List all universities with pagination, search, and filters
 */
router.get('/', cacheMiddleware(300), async (req, res) => {
  const { page = 1, limit = 20, search, country, is_active } = req.query;
  const offset = (page - 1) * limit;
  
  const pool = await getPool();
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIdx = 1;
  
  if (is_active !== 'false') {
    whereClause += ` AND (is_active IS NULL OR is_active = true)`;
  }
  
  if (search) {
    whereClause += ` AND (name ILIKE $${paramIdx} OR korean_name ILIKE $${paramIdx})`;
    params.push(`%${search}%`);
    paramIdx++;
  }
  
  if (country) {
    whereClause += ` AND country = $${paramIdx}`;
    params.push(country);
    paramIdx++;
  }
  
  try {
    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM universities ${whereClause}`;
    const { rows: countRows } = await pool.query(countQuery, params);
    const total = parseInt(countRows[0].total);
    
    // Get paginated results
    const query = `
      SELECT * FROM universities 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    params.push(limit, offset);
    
    const { rows } = await pool.query(query, params);
    
    res.json({
      data: rows.map(r => {
        let koreanData = {};
        try {
          koreanData = r.korean_data ? JSON.parse(r.korean_data) : {};
        } catch (e) {
          logger.warn('Invalid korean_data JSON', { id: r.id, korean_data: r.korean_data });
        }
        return { ...r, koreanData };
      }),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Failed to fetch universities', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch universities' });
  }
});

/**
 * GET /api/universities/:id
 * Get single university by ID
 */
router.get('/:id', async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      'SELECT * FROM universities WHERE id = $1',
      [req.params.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'University not found' });
    }
    
    res.json({
      ...rows[0],
      koreanData: (() => {
        try {
          return rows[0].korean_data ? JSON.parse(rows[0].korean_data) : {};
        } catch (e) {
          logger.warn('Invalid korean_data JSON for university', { id: req.params.id, korean_data: rows[0].korean_data });
          return {};
        }
      })()
    });
  } catch (error) {
    logger.error('Failed to fetch university', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to fetch university' });
  }
});

/**
 * POST /api/universities
 * Create new university (requires university:create permission)
 */
router.post('/', requirePermission('create', 'university'), async (req, res) => {
  const { name, koreanName, region, heroImage, thumbnail, koreanData, country, ranking, top_tier } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  const pool = await getPool();
  const id = uuidv4();
  
  try {
    await pool.query(
      `INSERT INTO universities (id, name, korean_name, region, country, ranking, top_tier,
        hero_image, thumbnail, korean_data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING id`,
      [
        id, name, koreanName, region, country || 'Hàn Quốc',
        ranking, top_tier,
        heroImage, thumbnail,
        koreanData ? JSON.stringify(koreanData) : null
      ]
    );
    
    await logAudit(req, 'CREATE', 'university', id, null, { name, koreanName, region });
    await invalidateUniversityCache();
    
    logger.info('University created', { id, name, userId: req.user.id });
    res.status(201).json({ id, message: 'University created successfully' });
  } catch (error) {
    logger.error('Failed to create university', { error: error.message, name });
    res.status(500).json({ error: 'Failed to create university' });
  }
});

/**
 * PUT /api/universities/:id
 * Update university (requires university:edit permission)
 */
router.put('/:id', requirePermission('edit', 'university'), async (req, res) => {
  const { name, koreanName, region, heroImage, thumbnail, koreanData, country, ranking, top_tier } = req.body;
  const pool = await getPool();
  
  try {
    // Get old data for audit
    const { rows: oldData } = await pool.query(
      'SELECT * FROM universities WHERE id = $1',
      [req.params.id]
    );
    
    if (!oldData[0]) {
      return res.status(404).json({ error: 'University not found' });
    }
    
    await pool.query(
      `UPDATE universities 
       SET name=$1, korean_name=$2, region=$3, country=$4, ranking=$5, top_tier=$6,
           hero_image=$7, thumbnail=$8, korean_data=$9, updated_at=NOW()
       WHERE id=$10`,
      [
        name, koreanName, region, country || oldData[0].country,
        ranking, top_tier,
        heroImage, thumbnail,
        koreanData ? JSON.stringify(koreanData) : oldData[0].korean_data,
        req.params.id
      ]
    );
    
    await logAudit(req, 'UPDATE', 'university', req.params.id, oldData[0], { name, koreanName, region });
    await invalidateUniversityCache();
    
    logger.info('University updated', { id: req.params.id, userId: req.user.id });
    res.json({ message: 'University updated successfully' });
  } catch (error) {
    logger.error('Failed to update university', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to update university' });
  }
});

/**
 * DELETE /api/universities/:id
 * Soft delete university (requires university:delete permission)
 */
router.delete('/:id', requirePermission('delete', 'university'), async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows: oldData } = await pool.query(
      'SELECT * FROM universities WHERE id = $1',
      [req.params.id]
    );
    
    if (!oldData[0]) {
      return res.status(404).json({ error: 'University not found' });
    }
    
    await pool.query(
      'UPDATE universities SET is_active = false, updated_at = NOW() WHERE id = $1',
      [req.params.id]
    );
    
    await logAudit(req, 'DELETE', 'university', req.params.id, oldData[0], { is_active: false });
    await invalidateUniversityCache();
    
    logger.info('University soft deleted', { id: req.params.id, userId: req.user.id });
    res.json({ message: 'University deleted (soft delete)' });
  } catch (error) {
    logger.error('Failed to delete university', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to delete university' });
  }
});

/**
 * PATCH /api/universities/:id/restore
 * Restore soft-deleted university
 */
router.patch('/:id/restore', requirePermission('edit', 'university'), async (req, res) => {
  const pool = await getPool();
  
  try {
    await pool.query(
      'UPDATE universities SET is_active = true, updated_at = NOW() WHERE id = $1',
      [req.params.id]
    );
    
    await logAudit(req, 'RESTORE', 'university', req.params.id, { is_active: false }, { is_active: true });
    await invalidateUniversityCache();
    
    logger.info('University restored', { id: req.params.id, userId: req.user.id });
    res.json({ message: 'University restored successfully' });
  } catch (error) {
    logger.error('Failed to restore university', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to restore university' });
  }
});

/**
 * POST /api/universities/import
 * Bulk import universities from JSON
 */
router.post('/import', requirePermission('create', 'university'), async (req, res) => {
  const { universities } = req.body;
  
  if (!Array.isArray(universities) || universities.length === 0) {
    return res.status(400).json({ error: 'Universities array required' });
  }
  
  if (universities.length > 100) {
    return res.status(400).json({ error: 'Maximum 100 universities per import' });
  }
  
  const pool = await getPool();
  const results = { created: [], updated: [], errors: [] };
  
  try {
    for (let i = 0; i < universities.length; i++) {
      const uni = universities[i];
      
      if (!uni.name) {
        results.errors.push({ index: i, error: 'Name is required' });
        continue;
      }
      
      try {
        // Check if university exists by name
        const { rows: existing } = await pool.query(
          'SELECT id FROM universities WHERE name ILIKE $1',
          [uni.name]
        );
        
        const id = existing[0]?.id || uuidv4();
        
        if (existing.length > 0) {
          // Update existing
          await pool.query(
            `UPDATE universities 
             SET name=$1, korean_name=$2, region=$3, country=$4, top_tier=$5, ranking=$6,
                 hero_image=$7, thumbnail=$8, korean_data=$9, updated_at=NOW()
             WHERE id=$10`,
            [
              uni.name, uni.koreanName || uni.korean_name, uni.region,
              uni.country || 'Hàn Quốc', uni.top_tier, uni.ranking,
              uni.heroImage, uni.thumbnail,
              uni.koreanData ? JSON.stringify(uni.koreanData) : null,
              id
            ]
          );
          results.updated.push({ id, name: uni.name });
          await logAudit(req, 'UPDATE', 'university', id, null, { name: uni.name });
        } else {
          // Create new
          await pool.query(
            `INSERT INTO universities (id, name, korean_name, region, country, top_tier, ranking,
                                     hero_image, thumbnail, korean_data, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
            [
              id, uni.name, uni.koreanName || uni.korean_name, uni.region,
              uni.country || 'Hàn Quốc', uni.top_tier, uni.ranking,
              uni.heroImage, uni.thumbnail,
              uni.koreanData ? JSON.stringify(uni.koreanData) : null
            ]
          );
          results.created.push({ id, name: uni.name });
          await logAudit(req, 'CREATE', 'university', id, null, { name: uni.name });
        }
      } catch (uniError) {
        results.errors.push({ index: i, name: uni.name, error: uniError.message });
        logger.error('University import error', { error: uniError.message, university: uni.name });
      }
    }
    
    await invalidateUniversityCache();
    
    logger.info('Bulk university import completed', {
      created: results.created.length,
      updated: results.updated.length,
      errors: results.errors.length
    });
    
    res.json({
      message: 'Import completed',
      summary: {
        total: universities.length,
        created: results.created.length,
        updated: results.updated.length,
        errors: results.errors.length
      },
      results
    });
  } catch (error) {
    logger.error('Bulk import failed', { error: error.message });
    res.status(500).json({ error: 'Failed to import universities' });
  }
});

export default router;
