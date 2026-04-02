/**
 * Visa Applications API Routes
 * Visa tracking and management
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../dbAdapter.js';
import { logger } from '../logger.js';
import { hasPermission } from '../utils/rbac.js';

const router = express.Router();

/**
 * GET /api/visa-applications
 * List visa applications
 */
router.get('/', async (req, res) => {
  const pool = await getPool();
  const hasFullAccess = hasPermission(req.user.role, 'manage', 'visa');
  const { status, student_id } = req.query;
  
  try {
    let query = hasFullAccess
      ? `SELECT v.*, u.name as student_name, r.university_id 
         FROM visa_applications v 
         JOIN users u ON v.student_id = u.id 
         LEFT JOIN registrations r ON v.registration_id = r.id `
      : `SELECT v.*, r.university_id 
         FROM visa_applications v 
         LEFT JOIN registrations r ON v.registration_id = r.id 
         WHERE v.student_id = $1`;
    
    const params = hasFullAccess ? [] : [req.user.id];
    const conditions = [];
    
    if (student_id && hasFullAccess) {
      conditions.push(`v.student_id = $${params.length + 1}`);
      params.push(student_id);
    }
    if (status) {
      conditions.push(`v.status = $${params.length + 1}`);
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += hasFullAccess ? ' WHERE ' + conditions.join(' AND ') : ' AND ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY v.created_at DESC';
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    logger.error('Failed to fetch visa applications', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch visa applications' });
  }
});

/**
 * GET /api/visa-applications/:id
 * Get single visa application
 */
router.get('/:id', async (req, res) => {
  const pool = await getPool();
  
  try {
    const hasFullAccess = hasPermission(req.user.role, 'manage', 'visa');
    
    const query = hasFullAccess
      ? `SELECT v.*, u.name as student_name 
         FROM visa_applications v 
         JOIN users u ON v.student_id = u.id 
         WHERE v.id = $1`
      : `SELECT * FROM visa_applications WHERE id = $1 AND student_id = $2`;
    
    const params = hasFullAccess ? [req.params.id] : [req.params.id, req.user.id];
    const { rows } = await pool.query(query, params);
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Visa application not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to fetch visa application', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to fetch visa application' });
  }
});

/**
 * POST /api/visa-applications
 * Create visa application
 */
router.post('/', async (req, res) => {
  const pool = await getPool();
  const student_id = req.user.role === 'student' ? req.user.id : (req.body.student_id || req.user.id);
  
  const {
    registration_id, visa_type, embassy_location, submission_date,
    appointment_date, appointment_time, documents_submitted, tracking_number
  } = req.body;
  
  if (!visa_type) {
    return res.status(400).json({ error: 'Visa type is required' });
  }
  
  try {
    const { rows } = await pool.query(
      `INSERT INTO visa_applications (id, student_id, registration_id, visa_type, embassy_location,
        submission_date, appointment_date, appointment_time, documents_submitted, tracking_number,
        status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'preparing', NOW(), NOW()) 
       RETURNING *`,
      [
        uuidv4(), student_id, registration_id || null, visa_type, embassy_location || null,
        submission_date || null, appointment_date || null, appointment_time || null,
        documents_submitted ? JSON.stringify(documents_submitted) : null, tracking_number || null
      ]
    );
    
    logger.info('Visa application created', { visaId: rows[0].id, studentId: student_id });
    res.status(201).json(rows[0]);
  } catch (error) {
    logger.error('Failed to create visa application', { error: error.message });
    res.status(500).json({ error: 'Failed to create visa application' });
  }
});

/**
 * PUT /api/visa-applications/:id
 * Update visa application
 */
router.put('/:id', async (req, res) => {
  const pool = await getPool();
  const hasFullAccess = hasPermission(req.user.role, 'manage', 'visa');
  
  try {
    // Check ownership
    if (!hasFullAccess) {
      const { rows: check } = await pool.query(
        'SELECT student_id FROM visa_applications WHERE id = $1',
        [req.params.id]
      );
      if (!check[0] || check[0].student_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    const allowedFields = [
      'visa_type', 'embassy_location', 'submission_date', 'appointment_date', 'appointment_time',
      'status', 'visa_number', 'issue_date', 'expiry_date', 'documents_submitted',
      'interview_required', 'interview_date', 'interview_notes', 'rejection_reason',
      'tracking_number', 'notes'
    ];
    
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(req.body)) {
      if (allowedFields.includes(key)) {
        if (key === 'documents_submitted' && value) {
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
      `UPDATE visa_applications SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Visa application not found' });
    }
    
    logger.info('Visa application updated', { id: req.params.id, userId: req.user.id });
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to update visa application', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to update visa application' });
  }
});

/**
 * DELETE /api/visa-applications/:id
 * Delete visa application (admin only)
 */
router.delete('/:id', async (req, res) => {
  const hasFullAccess = hasPermission(req.user.role, 'manage', 'visa');
  
  if (!hasFullAccess) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      'DELETE FROM visa_applications WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Visa application not found' });
    }
    
    logger.info('Visa application deleted', { id: req.params.id, adminId: req.user.id });
    res.json({ message: 'Visa application deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete visa application', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to delete visa application' });
  }
});

export default router;
