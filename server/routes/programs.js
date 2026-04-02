/**
 * Programs API Routes
 * University study programs
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../dbAdapter.js';
import { logger } from '../logger.js';
import { requirePermission, hasPermission } from '../utils/rbac.js';

const router = express.Router();

/**
 * GET /api/programs
 * List all programs (public read)
 */
router.get('/', async (req, res) => {
  const pool = await getPool();
  const { university_id, degree_type, language, is_active = 'true' } = req.query;
  
  try {
    let query = `
      SELECT p.*, u.name as university_name, u.korean_name as university_korean_name 
      FROM programs p 
      JOIN universities u ON p.university_id = u.id 
      WHERE 1=1
    `;
    const params = [];
    
    if (university_id) {
      query += ` AND p.university_id = $${params.length + 1}`;
      params.push(university_id);
    }
    if (degree_type) {
      query += ` AND p.degree_type = $${params.length + 1}`;
      params.push(degree_type);
    }
    if (language) {
      query += ` AND p.language = $${params.length + 1}`;
      params.push(language);
    }
    if (is_active === 'true') {
      query += ` AND p.is_active = true`;
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    logger.error('Failed to fetch programs', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

/**
 * GET /api/programs/:id
 * Get single program
 */
router.get('/:id', async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      `SELECT p.*, u.name as university_name 
       FROM programs p 
       JOIN universities u ON p.university_id = u.id 
       WHERE p.id = $1`,
      [req.params.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to fetch program', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to fetch program' });
  }
});

/**
 * POST /api/programs
 * Create program (admin only)
 */
router.post('/', requirePermission('manage', 'program'), async (req, res) => {
  const {
    university_id, name, korean_name, degree_type, language,
    duration_months, tuition_fee, currency, description,
    requirements, deadline, intake_dates
  } = req.body;
  
  if (!university_id || !name || !degree_type) {
    return res.status(400).json({ error: 'University ID, name, and degree type are required' });
  }
  
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      `INSERT INTO programs (id, university_id, name, korean_name, degree_type, language,
        duration_months, tuition_fee, currency, description, requirements, deadline,
        intake_dates, created_by, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()) 
       RETURNING *`,
      [
        uuidv4(), university_id, name, korean_name || null, degree_type, language || 'korean',
        duration_months || null, tuition_fee || null, currency || 'KRW', description || null,
        requirements || null, deadline || null, intake_dates ? JSON.stringify(intake_dates) : null,
        req.user.id
      ]
    );
    
    logger.info('Program created', { programId: rows[0].id, universityId: university_id });
    res.status(201).json(rows[0]);
  } catch (error) {
    logger.error('Failed to create program', { error: error.message, universityId: university_id });
    res.status(500).json({ error: 'Failed to create program' });
  }
});

/**
 * PUT /api/programs/:id
 * Update program (admin only)
 */
router.put('/:id', requirePermission('manage', 'program'), async (req, res) => {
  const pool = await getPool();
  const updateFields = req.body;
  
  try {
    const allowedFields = [
      'name', 'korean_name', 'degree_type', 'language', 'duration_months',
      'tuition_fee', 'currency', 'description', 'requirements', 'deadline',
      'intake_dates', 'is_active'
    ];
    
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updateFields)) {
      if (allowedFields.includes(key)) {
        if (key === 'intake_dates' && value) {
          updates.push(`${key} = $${paramIndex++}`);
          params.push(JSON.stringify(value));
        } else {
          updates.push(`${key} = $${paramIndex++}`);
          params.push(value);
        }
      }
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updates.push(`updated_at = NOW()`);
    params.push(req.params.id);
    
    const { rows } = await pool.query(
      `UPDATE programs SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    logger.info('Program updated', { id: req.params.id, adminId: req.user.id });
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to update program', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to update program' });
  }
});

/**
 * DELETE /api/programs/:id
 * Delete program (admin only)
 */
router.delete('/:id', requirePermission('manage', 'program'), async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      'DELETE FROM programs WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    logger.info('Program deleted', { id: req.params.id, adminId: req.user.id });
    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete program', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to delete program' });
  }
});

export default router;
