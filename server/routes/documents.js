/**
 * Documents API Routes
 * File uploads and document management
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../dbAdapter.js';
import { logger } from '../logger.js';
import { hasPermission } from '../utils/rbac.js';

const router = express.Router();

/**
 * GET /api/documents
 * List documents (students see own, admins see all)
 */
router.get('/', async (req, res) => {
  const pool = await getPool();
  const hasFullAccess = hasPermission(req.user.role, 'manage', 'document');
  const { student_id, status, type } = req.query;
  
  try {
    let query = hasFullAccess
      ? `SELECT d.*, u.name as student_name 
         FROM documents d 
         JOIN users u ON d.student_id = u.id `
      : `SELECT d.* FROM documents d WHERE d.student_id = $1`;
    
    const params = hasFullAccess ? [] : [req.user.id];
    const conditions = [];
    
    if (student_id && hasFullAccess) {
      conditions.push(`d.student_id = $${params.length + 1}`);
      params.push(student_id);
    }
    if (status) {
      conditions.push(`d.status = $${params.length + 1}`);
      params.push(status);
    }
    if (type) {
      conditions.push(`d.document_type = $${params.length + 1}`);
      params.push(type);
    }
    
    if (conditions.length > 0) {
      query += hasFullAccess ? ' WHERE ' + conditions.join(' AND ') : ' AND ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY d.created_at DESC';
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    logger.error('Failed to fetch documents', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

/**
 * GET /api/documents/:id
 * Get single document
 */
router.get('/:id', async (req, res) => {
  const pool = await getPool();
  
  try {
    const hasFullAccess = hasPermission(req.user.role, 'manage', 'document');
    
    const query = hasFullAccess
      ? 'SELECT d.*, u.name as student_name FROM documents d JOIN users u ON d.student_id = u.id WHERE d.id = $1'
      : 'SELECT * FROM documents WHERE id = $1 AND student_id = $2';
    
    const params = hasFullAccess ? [req.params.id] : [req.params.id, req.user.id];
    const { rows } = await pool.query(query, params);
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to fetch document', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

/**
 * POST /api/documents
 * Create document record
 */
router.post('/', async (req, res) => {
  const pool = await getPool();
  const student_id = req.user.role === 'student' ? req.user.id : (req.body.student_id || req.user.id);
  
  if (req.user.role !== 'student' && !req.body.student_id) {
    return res.status(400).json({ error: 'Student ID is required for admin uploads' });
  }
  
  const { document_type, file_name, file_url, file_size, mime_type, notes } = req.body;
  
  if (!document_type || !file_name || !file_url) {
    return res.status(400).json({ error: 'Document type, file name, and file URL are required' });
  }
  
  try {
    const { rows } = await pool.query(
      `INSERT INTO documents (id, student_id, document_type, file_name, file_url, file_size, mime_type, status, notes, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
       RETURNING *`,
      [uuidv4(), student_id, document_type, file_name, file_url, file_size || null, mime_type || null, 'pending', notes || null]
    );
    
    logger.info('Document created', { documentId: rows[0].id, studentId: student_id, type: document_type });
    res.status(201).json(rows[0]);
  } catch (error) {
    logger.error('Failed to create document', { error: error.message, studentId: student_id });
    res.status(500).json({ error: 'Failed to create document' });
  }
});

/**
 * PUT /api/documents/:id/review
 * Review document (admin only)
 */
router.put('/:id/review', async (req, res) => {
  const hasFullAccess = hasPermission(req.user.role, 'manage', 'document');
  
  if (!hasFullAccess) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { status, notes } = req.body;
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      `UPDATE documents SET status = $1, notes = COALESCE($2, notes), reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW() 
       WHERE id = $4 RETURNING *`,
      [status, notes || null, req.user.id, req.params.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    logger.info('Document reviewed', { id: req.params.id, status, adminId: req.user.id });
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to review document', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to review document' });
  }
});

/**
 * DELETE /api/documents/:id
 * Delete document
 */
router.delete('/:id', async (req, res) => {
  const pool = await getPool();
  
  try {
    const hasFullAccess = hasPermission(req.user.role, 'manage', 'document');
    
    const query = hasFullAccess
      ? 'DELETE FROM documents WHERE id = $1 RETURNING id'
      : 'DELETE FROM documents WHERE id = $1 AND student_id = $2 RETURNING id';
    
    const params = hasFullAccess ? [req.params.id] : [req.params.id, req.user.id];
    const { rows } = await pool.query(query, params);
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    logger.info('Document deleted', { id: req.params.id, userId: req.user.id });
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete document', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
