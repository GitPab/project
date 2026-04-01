/**
 * Registration Routes
 * Student application registrations
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../dbAdapter.js';
import { logger } from '../logger.js';
import { requirePermission, hasPermission } from '../utils/rbac.js';
import { broadcastEvent } from '../sseManager.js';

const router = express.Router();

/**
 * GET /api/registrations
 * List registrations (students see own, admins see all)
 */
router.get('/', async (req, res) => {
  const pool = await getPool();
  const hasFullAccess = hasPermission(req.user.role, 'manage', 'application');
  
  try {
    const query = hasFullAccess
      ? `SELECT r.*, u.name as student_name, un.name as university_name 
         FROM registrations r 
         JOIN users u ON r.student_id = u.id 
         JOIN universities un ON r.university_id = un.id 
         ORDER BY r.created_at DESC`
      : `SELECT r.*, un.name as university_name 
         FROM registrations r 
         JOIN universities un ON r.university_id = un.id 
         WHERE r.student_id = $1 
         ORDER BY r.created_at DESC`;
    
    const { rows } = await pool.query(query, hasFullAccess ? [] : [req.user.id]);
    res.json(rows);
  } catch (error) {
    logger.error('Failed to fetch registrations', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

/**
 * POST /api/registrations
 * Create new registration (student applies to university)
 */
router.post('/', async (req, res) => {
  const { universityId, visaSystem } = req.body;
  
  if (!universityId) {
    return res.status(400).json({ error: 'University ID is required' });
  }
  
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      'INSERT INTO registrations (id, student_id, university_id, visa_system) VALUES ($1, $2, $3, $4) RETURNING id',
      [uuidv4(), req.user.id, universityId, visaSystem]
    );
    
    logger.info('Registration created', { registrationId: rows[0].id, studentId: req.user.id, universityId });
    
    // Broadcast real-time event
    broadcastEvent('new_registration', {
      id: rows[0].id,
      studentId: req.user.id,
      studentName: req.user.name,
      universityId,
      visaSystem,
      createdAt: new Date().toISOString()
    });
    
    res.status(201).json({ id: rows[0].id, message: 'Registration created successfully' });
  } catch (error) {
    logger.error('Failed to create registration', { error: error.message, studentId: req.user.id });
    res.status(500).json({ error: 'Failed to create registration' });
  }
});

/**
 * GET /api/registrations/:id
 * Get single registration details
 */
router.get('/:id', async (req, res) => {
  const pool = await getPool();
  
  try {
    const hasFullAccess = hasPermission(req.user.role, 'manage', 'application');
    
    const query = hasFullAccess
      ? `SELECT r.*, u.name as student_name, un.name as university_name 
         FROM registrations r 
         JOIN users u ON r.student_id = u.id 
         JOIN universities un ON r.university_id = un.id 
         WHERE r.id = $1`
      : `SELECT r.*, un.name as university_name 
         FROM registrations r 
         JOIN universities un ON r.university_id = un.id 
         WHERE r.id = $1 AND r.student_id = $2`;
    
    const params = hasFullAccess ? [req.params.id] : [req.params.id, req.user.id];
    const { rows } = await pool.query(query, params);
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to fetch registration', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to fetch registration' });
  }
});

/**
 * PUT /api/registrations/:id
 * Update registration status (admin only)
 */
router.put('/:id', requirePermission('manage', 'application'), async (req, res) => {
  const { status, notes } = req.body;
  const pool = await getPool();
  
  try {
    const { rows: existing } = await pool.query(
      'SELECT * FROM registrations WHERE id = $1',
      [req.params.id]
    );
    
    if (!existing[0]) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    await pool.query(
      'UPDATE registrations SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, req.params.id]
    );
    
    logger.info('Registration updated', { id: req.params.id, status, adminId: req.user.id });
    res.json({ message: 'Registration updated successfully' });
  } catch (error) {
    logger.error('Failed to update registration', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to update registration' });
  }
});

/**
 * DELETE /api/registrations/:id
 * Cancel/delete registration
 */
router.delete('/:id', async (req, res) => {
  const pool = await getPool();
  
  try {
    // Check if user owns this registration or is admin
    const hasFullAccess = hasPermission(req.user.role, 'manage', 'application');
    
    const { rows } = await pool.query(
      hasFullAccess
        ? 'SELECT * FROM registrations WHERE id = $1'
        : 'SELECT * FROM registrations WHERE id = $1 AND student_id = $2',
      hasFullAccess ? [req.params.id] : [req.params.id, req.user.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    await pool.query('DELETE FROM registrations WHERE id = $1', [req.params.id]);
    
    logger.info('Registration deleted', { id: req.params.id, userId: req.user.id });
    res.json({ message: 'Registration deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete registration', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to delete registration' });
  }
});

export default router;
