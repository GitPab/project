/**
 * Appointments API Routes
 * Calendar and scheduling
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../dbAdapter.js';
import { logger } from '../logger.js';
import { hasPermission } from '../utils/rbac.js';

const router = express.Router();

/**
 * GET /api/appointments
 * List appointments
 */
router.get('/', async (req, res) => {
  const pool = await getPool();
  const hasFullAccess = hasPermission(req.user.role, 'manage', 'appointment');
  const { status, date_from, date_to } = req.query;
  
  try {
    let query = hasFullAccess
      ? `SELECT a.*, s.name as student_name, adm.name as admin_name 
         FROM appointments a 
         JOIN users s ON a.student_id = s.id 
         LEFT JOIN users adm ON a.admin_id = adm.id `
      : `SELECT a.*, adm.name as admin_name 
         FROM appointments a 
         LEFT JOIN users adm ON a.admin_id = adm.id 
         WHERE a.student_id = $1 `;
    
    const params = hasFullAccess ? [] : [req.user.id];
    const conditions = [];
    
    if (status) {
      conditions.push(`a.status = $${params.length + 1}`);
      params.push(status);
    }
    if (date_from) {
      conditions.push(`a.start_time >= $${params.length + 1}`);
      params.push(date_from);
    }
    if (date_to) {
      conditions.push(`a.start_time <= $${params.length + 1}`);
      params.push(date_to);
    }
    
    if (conditions.length > 0) {
      query += hasFullAccess ? ' WHERE ' + conditions.join(' AND ') : ' AND ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY a.start_time ASC';
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    logger.error('Failed to fetch appointments', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

/**
 * GET /api/appointments/:id
 * Get single appointment
 */
router.get('/:id', async (req, res) => {
  const pool = await getPool();
  
  try {
    const hasFullAccess = hasPermission(req.user.role, 'manage', 'appointment');
    
    const query = hasFullAccess
      ? `SELECT a.*, s.name as student_name, adm.name as admin_name 
         FROM appointments a 
         JOIN users s ON a.student_id = s.id 
         LEFT JOIN users adm ON a.admin_id = adm.id 
         WHERE a.id = $1`
      : `SELECT a.*, adm.name as admin_name 
         FROM appointments a 
         LEFT JOIN users adm ON a.admin_id = adm.id 
         WHERE a.id = $1 AND a.student_id = $2`;
    
    const params = hasFullAccess ? [req.params.id] : [req.params.id, req.user.id];
    const { rows } = await pool.query(query, params);
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to fetch appointment', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

/**
 * POST /api/appointments
 * Create appointment (admin only)
 */
router.post('/', async (req, res) => {
  const hasFullAccess = hasPermission(req.user.role, 'manage', 'appointment');
  
  if (!hasFullAccess) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const {
    student_id, title, description, appointment_type,
    start_time, end_time, location, is_online, meeting_link
  } = req.body;
  
  if (!student_id || !title || !start_time) {
    return res.status(400).json({ error: 'Student ID, title, and start time are required' });
  }
  
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      `INSERT INTO appointments (id, student_id, admin_id, title, description, appointment_type,
        start_time, end_time, location, is_online, meeting_link, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'scheduled', NOW(), NOW()) 
       RETURNING *`,
      [
        uuidv4(), student_id, req.user.id, title, description || null, appointment_type || 'consultation',
        start_time, end_time || null, location || null, is_online || false, meeting_link || null
      ]
    );
    
    logger.info('Appointment created', { appointmentId: rows[0].id, studentId: student_id });
    res.status(201).json(rows[0]);
  } catch (error) {
    logger.error('Failed to create appointment', { error: error.message });
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

/**
 * PUT /api/appointments/:id
 * Update appointment
 */
router.put('/:id', async (req, res) => {
  const pool = await getPool();
  const hasFullAccess = hasPermission(req.user.role, 'manage', 'appointment');
  
  try {
    // Check ownership
    if (!hasFullAccess) {
      const { rows: check } = await pool.query(
        'SELECT student_id FROM appointments WHERE id = $1',
        [req.params.id]
      );
      if (!check[0] || check[0].student_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    const allowedFields = ['title', 'description', 'start_time', 'end_time', 'location', 'is_online', 'meeting_link', 'status', 'notes'];
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
      `UPDATE appointments SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    logger.info('Appointment updated', { id: req.params.id });
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to update appointment', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

/**
 * DELETE /api/appointments/:id
 * Cancel/delete appointment
 */
router.delete('/:id', async (req, res) => {
  const pool = await getPool();
  const hasFullAccess = hasPermission(req.user.role, 'manage', 'appointment');
  
  try {
    let query;
    let params;
    
    if (hasFullAccess) {
      query = 'DELETE FROM appointments WHERE id = $1 RETURNING id';
      params = [req.params.id];
    } else {
      query = 'DELETE FROM appointments WHERE id = $1 AND student_id = $2 RETURNING id';
      params = [req.params.id, req.user.id];
    }
    
    const { rows } = await pool.query(query, params);
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    logger.info('Appointment deleted', { id: req.params.id, userId: req.user.id });
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete appointment', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

export default router;
