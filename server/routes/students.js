/**
 * Student Routes
 * Student management for admin users
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../dbAdapter.js';
import { logger } from '../logger.js';
import { logAudit } from '../utils/audit.js';
import { requirePermission } from '../utils/rbac.js';

const router = express.Router();

/**
 * GET /api/students
 * List all students with pagination and search
 */
router.get('/', requirePermission('view', 'student'), async (req, res) => {
  const { page = 1, limit = 20, search, status } = req.query;
  const offset = (page - 1) * limit;
  
  const pool = await getPool();
  
  let whereClause = "WHERE role = 'student'";
  const params = [];
  let paramIdx = 1;
  
  if (status) {
    whereClause += ` AND is_active = $${paramIdx}`;
    params.push(status === 'active');
    paramIdx++;
  }
  
  if (search) {
    whereClause += ` AND (name ILIKE $${paramIdx} OR email ILIKE $${paramIdx})`;
    params.push(`%${search}%`);
    paramIdx++;
  }
  
  try {
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const { rows: countRows } = await pool.query(countQuery, params);
    const total = parseInt(countRows[0].total);
    
    // Get paginated results
    const query = `
      SELECT id, name, email, phone, is_active, last_login, created_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    params.push(limit, offset);
    
    const { rows } = await pool.query(query, params);
    
    res.json({
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Failed to fetch students', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

/**
 * GET /api/students/:id
 * Get student details with registrations
 */
router.get('/:id', requirePermission('view', 'student'), async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      "SELECT id, name, email, phone, role, is_active, last_login, created_at FROM users WHERE id = $1 AND role = 'student'",
      [req.params.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Get student's registrations
    const { rows: registrations } = await pool.query(
      `SELECT r.*, u.name as university_name 
       FROM registrations r 
       JOIN universities u ON r.university_id = u.id 
       WHERE r.student_id = $1`,
      [req.params.id]
    );
    
    res.json({
      ...rows[0],
      registrations
    });
  } catch (error) {
    logger.error('Failed to fetch student', { error: error.message, studentId: req.params.id });
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

/**
 * POST /api/students
 * Create new student (admin only)
 */
router.post('/', requirePermission('create', 'student'), async (req, res) => {
  const { name, email, password, phone } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, password required' });
  }
  
  const pool = await getPool();
  
  try {
    const hash = await bcrypt.hash(password, 12);
    const id = uuidv4();
    
    const { rows } = await pool.query(
      "INSERT INTO users (id, name, email, phone, password, role) VALUES ($1, $2, $3, $4, $5, 'student') RETURNING id, name, email",
      [id, name, email.toLowerCase(), phone || null, hash]
    );
    
    await logAudit(req, 'CREATE', 'student', id, null, { name, email });
    logger.info('Student created', { studentId: id, email });
    
    res.status(201).json({ user: rows[0], message: 'Student created successfully' });
  } catch (error) {
    if (error.message?.includes('unique constraint') || error.message?.includes('duplicate key')) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    logger.error('Failed to create student', { error: error.message, email });
    res.status(500).json({ error: 'Failed to create student' });
  }
});

/**
 * PUT /api/students/:id
 * Update student
 */
router.put('/:id', requirePermission('edit', 'student'), async (req, res) => {
  const { name, phone, is_active } = req.body;
  const pool = await getPool();
  
  try {
    const { rows: existing } = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND role = 'student'",
      [req.params.id]
    );
    
    if (!existing[0]) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    await pool.query(
      'UPDATE users SET name=$1, phone=$2, is_active=$3, updated_at=NOW() WHERE id=$4',
      [
        name || existing[0].name,
        phone || existing[0].phone,
        is_active !== undefined ? is_active : existing[0].is_active,
        req.params.id
      ]
    );
    
    await logAudit(req, 'UPDATE', 'student', req.params.id, existing[0], { name, phone, is_active });
    logger.info('Student updated', { studentId: req.params.id });
    
    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    logger.error('Failed to update student', { error: error.message, studentId: req.params.id });
    res.status(500).json({ error: 'Failed to update student' });
  }
});

/**
 * DELETE /api/students/:id
 * Soft delete student
 */
router.delete('/:id', requirePermission('delete', 'student'), async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND role = 'student'",
      [req.params.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    await pool.query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
      [req.params.id]
    );
    
    await logAudit(req, 'DELETE', 'student', req.params.id, rows[0], { is_active: false });
    logger.info('Student deactivated', { studentId: req.params.id });
    
    res.json({ message: 'Student deactivated successfully' });
  } catch (error) {
    logger.error('Failed to delete student', { error: error.message, studentId: req.params.id });
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

/**
 * PATCH /api/students/:id/toggle-active
 * Toggle student active status
 */
router.patch('/:id/toggle-active', requirePermission('manage', 'user'), async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      'SELECT is_active FROM users WHERE id = $1',
      [req.params.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const newStatus = !rows[0].is_active;
    await pool.query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2',
      [newStatus, req.params.id]
    );
    
    await logAudit(req, newStatus ? 'RESTORE' : 'DELETE', 'user', req.params.id, { is_active: rows[0].is_active }, { is_active: newStatus });
    logger.info('User status toggled', { userId: req.params.id, is_active: newStatus });
    
    res.json({ message: `User ${newStatus ? 'activated' : 'deactivated'}`, is_active: newStatus });
  } catch (error) {
    logger.error('Failed to toggle user status', { error: error.message, userId: req.params.id });
    res.status(500).json({ error: 'Failed to toggle status' });
  }
});

export default router;
