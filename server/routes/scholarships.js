/**
 * Scholarships API Routes
 * Scholarship management and applications
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../dbAdapter.js';
import { logger } from '../logger.js';
import { requirePermission, hasPermission } from '../utils/rbac.js';

const router = express.Router();

// ============== SCHOLARSHIPS ==============

/**
 * GET /api/scholarships
 * List all scholarships (public)
 */
router.get('/', async (req, res) => {
  const pool = await getPool();
  const { university_id, is_active = 'true' } = req.query;
  
  try {
    let query = `
      SELECT s.*, u.name as university_name 
      FROM scholarships s 
      LEFT JOIN universities u ON s.university_id = u.id 
      WHERE 1=1
    `;
    const params = [];
    
    if (university_id) {
      query += ` AND s.university_id = $${params.length + 1}`;
      params.push(university_id);
    }
    if (is_active === 'true') {
      query += ` AND s.is_active = true`;
    }
    
    query += ' ORDER BY s.created_at DESC';
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    logger.error('Failed to fetch scholarships', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch scholarships' });
  }
});

/**
 * GET /api/scholarships/:id
 * Get single scholarship
 */
router.get('/:id', async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      `SELECT s.*, u.name as university_name 
       FROM scholarships s 
       LEFT JOIN universities u ON s.university_id = u.id 
       WHERE s.id = $1`,
      [req.params.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Scholarship not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to fetch scholarship', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to fetch scholarship' });
  }
});

/**
 * POST /api/scholarships
 * Create scholarship (admin only)
 */
router.post('/', requirePermission('manage', 'scholarship'), async (req, res) => {
  const {
    university_id, name, name_korean, description,
    amount_vnd, amount_krw, eligibility_criteria,
    application_deadline, requirements, max_recipients
  } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Scholarship name is required' });
  }
  
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      `INSERT INTO scholarships (id, university_id, name, name_korean, description,
        amount_vnd, amount_krw, eligibility_criteria, application_deadline,
        requirements, max_recipients, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) 
       RETURNING *`,
      [
        uuidv4(), university_id || null, name, name_korean || null, description || null,
        amount_vnd || null, amount_krw || null, eligibility_criteria || null,
        application_deadline || null, requirements || null, max_recipients || null
      ]
    );
    
    logger.info('Scholarship created', { scholarshipId: rows[0].id });
    res.status(201).json(rows[0]);
  } catch (error) {
    logger.error('Failed to create scholarship', { error: error.message });
    res.status(500).json({ error: 'Failed to create scholarship' });
  }
});

/**
 * PUT /api/scholarships/:id
 * Update scholarship (admin only)
 */
router.put('/:id', requirePermission('manage', 'scholarship'), async (req, res) => {
  const pool = await getPool();
  
  try {
    const allowedFields = [
      'university_id', 'name', 'name_korean', 'description', 'amount_vnd',
      'amount_krw', 'eligibility_criteria', 'application_deadline',
      'requirements', 'max_recipients', 'is_active'
    ];
    
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(req.body)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramIndex++}`);
        params.push(value);
      }
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updates.push(`updated_at = NOW()`);
    params.push(req.params.id);
    
    const { rows } = await pool.query(
      `UPDATE scholarships SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Scholarship not found' });
    }
    
    logger.info('Scholarship updated', { id: req.params.id });
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to update scholarship', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to update scholarship' });
  }
});

/**
 * DELETE /api/scholarships/:id
 * Delete scholarship (admin only)
 */
router.delete('/:id', requirePermission('manage', 'scholarship'), async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      'DELETE FROM scholarships WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Scholarship not found' });
    }
    
    logger.info('Scholarship deleted', { id: req.params.id });
    res.json({ message: 'Scholarship deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete scholarship', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to delete scholarship' });
  }
});

// ============== SCHOLARSHIP APPLICATIONS ==============

/**
 * GET /api/scholarships/applications/my
 * Get current student's applications
 */
router.get('/applications/my', async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      `SELECT sa.*, s.name as scholarship_name, s.amount_vnd, s.amount_krw, u.name as university_name 
       FROM scholarship_applications sa 
       JOIN scholarships s ON sa.scholarship_id = s.id 
       LEFT JOIN universities u ON s.university_id = u.id 
       WHERE sa.student_id = $1 
       ORDER BY sa.applied_at DESC`,
      [req.user.id]
    );
    
    res.json(rows);
  } catch (error) {
    logger.error('Failed to fetch scholarship applications', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch scholarship applications' });
  }
});

/**
 * GET /api/scholarships/applications
 * List all applications (admin only)
 */
router.get('/applications/all', async (req, res) => {
  const hasFullAccess = hasPermission(req.user.role, 'manage', 'scholarship');
  
  if (!hasFullAccess) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const pool = await getPool();
  const { status } = req.query;
  
  try {
    let query = `
      SELECT sa.*, s.name as scholarship_name, u.name as student_name 
      FROM scholarship_applications sa 
      JOIN scholarships s ON sa.scholarship_id = s.id 
      JOIN users u ON sa.student_id = u.id
    `;
    const params = [];
    
    if (status) {
      query += ` WHERE sa.status = $1`;
      params.push(status);
    }
    
    query += ' ORDER BY sa.applied_at DESC';
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    logger.error('Failed to fetch scholarship applications', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch scholarship applications' });
  }
});

/**
 * POST /api/scholarships/:id/apply
 * Apply for scholarship
 */
router.post('/:id/apply', async (req, res) => {
  const { registration_id, documents } = req.body;
  const pool = await getPool();
  
  try {
    // Check if already applied
    const { rows: existing } = await pool.query(
      'SELECT id FROM scholarship_applications WHERE scholarship_id = $1 AND student_id = $2',
      [req.params.id, req.user.id]
    );
    
    if (existing[0]) {
      return res.status(400).json({ error: 'Already applied for this scholarship' });
    }
    
    const { rows } = await pool.query(
      `INSERT INTO scholarship_applications (id, scholarship_id, student_id, registration_id, status, documents, applied_at) 
       VALUES ($1, $2, $3, $4, 'pending', $5, NOW()) 
       RETURNING *`,
      [uuidv4(), req.params.id, req.user.id, registration_id || null, documents ? JSON.stringify(documents) : null]
    );
    
    logger.info('Scholarship application submitted', { applicationId: rows[0].id, scholarshipId: req.params.id, studentId: req.user.id });
    res.status(201).json(rows[0]);
  } catch (error) {
    logger.error('Failed to apply for scholarship', { error: error.message, scholarshipId: req.params.id });
    res.status(500).json({ error: 'Failed to apply for scholarship' });
  }
});

/**
 * PUT /api/scholarships/applications/:id/decision
 * Make decision on application (admin only)
 */
router.put('/applications/:id/decision', async (req, res) => {
  const hasFullAccess = hasPermission(req.user.role, 'manage', 'scholarship');
  
  if (!hasFullAccess) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { status, decision_notes, amount_awarded_vnd, amount_awarded_krw } = req.body;
  const pool = await getPool();
  
  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected' });
  }
  
  try {
    const { rows } = await pool.query(
      `UPDATE scholarship_applications 
       SET status = $1, decision_notes = $2, amount_awarded_vnd = $3, amount_awarded_krw = $4, decision_date = NOW() 
       WHERE id = $5 RETURNING *`,
      [status, decision_notes || null, amount_awarded_vnd || null, amount_awarded_krw || null, req.params.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    logger.info('Scholarship decision made', { applicationId: req.params.id, status });
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to make decision', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to make decision' });
  }
});

export default router;
