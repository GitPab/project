/**
 * Payments API Routes
 * Financial transactions for students
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../dbAdapter.js';
import { logger } from '../logger.js';
import { requirePermission, hasPermission } from '../utils/rbac.js';

const router = express.Router();

/**
 * GET /api/payments
 * List payments (students see own, admins see all)
 */
router.get('/', async (req, res) => {
  const pool = await getPool();
  const hasFullAccess = hasPermission(req.user.role, 'manage', 'payment');
  
  try {
    const query = hasFullAccess
      ? `SELECT p.*, u.name as student_name, r.university_id 
         FROM payments p 
         JOIN users u ON p.student_id = u.id 
         LEFT JOIN registrations r ON p.registration_id = r.id 
         ORDER BY p.created_at DESC`
      : `SELECT p.*, r.university_id 
         FROM payments p 
         LEFT JOIN registrations r ON p.registration_id = r.id 
         WHERE p.student_id = $1 
         ORDER BY p.created_at DESC`;
    
    const { rows } = await pool.query(query, hasFullAccess ? [] : [req.user.id]);
    res.json(rows);
  } catch (error) {
    logger.error('Failed to fetch payments', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

/**
 * GET /api/payments/:id
 * Get single payment details
 */
router.get('/:id', async (req, res) => {
  const pool = await getPool();
  
  try {
    const hasFullAccess = hasPermission(req.user.role, 'manage', 'payment');
    
    const query = hasFullAccess
      ? `SELECT p.*, u.name as student_name 
         FROM payments p 
         JOIN users u ON p.student_id = u.id 
         WHERE p.id = $1`
      : `SELECT * FROM payments WHERE id = $1 AND student_id = $2`;
    
    const params = hasFullAccess ? [req.params.id] : [req.params.id, req.user.id];
    const { rows } = await pool.query(query, params);
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to fetch payment', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

/**
 * POST /api/payments
 * Create new payment (admin only)
 */
router.post('/', requirePermission('manage', 'payment'), async (req, res) => {
  const { student_id, registration_id, amount, currency, payment_method, payment_type, description, notes } = req.body;
  
  if (!student_id || !amount || !payment_method) {
    return res.status(400).json({ error: 'Student ID, amount, and payment method are required' });
  }
  
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      `INSERT INTO payments (id, student_id, registration_id, amount, currency, payment_method, 
        payment_type, description, notes, processed_by, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) 
       RETURNING *`,
      [uuidv4(), student_id, registration_id || null, amount, currency || 'VND', 
       payment_method, payment_type || 'application_fee', description || null, notes || null, req.user.id]
    );
    
    logger.info('Payment created', { paymentId: rows[0].id, studentId: student_id, amount });
    res.status(201).json(rows[0]);
  } catch (error) {
    logger.error('Failed to create payment', { error: error.message, studentId: student_id });
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

/**
 * PUT /api/payments/:id
 * Update payment status
 */
router.put('/:id', requirePermission('manage', 'payment'), async (req, res) => {
  const { status, paid_at, transaction_id, payment_proof_url } = req.body;
  const pool = await getPool();
  
  try {
    const { rows: existing } = await pool.query(
      'SELECT * FROM payments WHERE id = $1',
      [req.params.id]
    );
    
    if (!existing[0]) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (paid_at !== undefined) {
      updates.push(`paid_at = $${paramIndex++}`);
      params.push(paid_at || null);
    }
    if (transaction_id !== undefined) {
      updates.push(`transaction_id = $${paramIndex++}`);
      params.push(transaction_id || null);
    }
    if (payment_proof_url !== undefined) {
      updates.push(`payment_proof_url = $${paramIndex++}`);
      params.push(payment_proof_url || null);
    }
    
    updates.push(`updated_at = NOW()`);
    params.push(req.params.id);
    
    const { rows } = await pool.query(
      `UPDATE payments SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    
    logger.info('Payment updated', { id: req.params.id, status, adminId: req.user.id });
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to update payment', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

/**
 * DELETE /api/payments/:id
 * Delete payment (admin only)
 */
router.delete('/:id', requirePermission('manage', 'payment'), async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      'DELETE FROM payments WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    logger.info('Payment deleted', { id: req.params.id, adminId: req.user.id });
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete payment', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

/**
 * GET /api/payments/student/summary
 * Get payment summary for current student
 */
router.get('/student/summary', async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      `SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending
       FROM payments 
       WHERE student_id = $1`,
      [req.user.id]
    );
    
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to fetch payment summary', { error: error.message, studentId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch payment summary' });
  }
});

export default router;
