import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getPool } from '../dbAdapter.js';
import { requirePermission } from '../utils/rbac.js';

const router = express.Router();

// GET /api/media - Get all media items
router.get('/', async (req, res) => {
  const pool = await getPool();
  try {
    const { type, university_id } = req.query;
    
    let query = 'SELECT * FROM media';
    const params = [];
    const conditions = [];
    
    if (type && type !== 'all') {
      conditions.push('type = $1');
      params.push(type);
    }
    
    if (university_id) {
      conditions.push(`university_id = $${params.length + 1}`);
      params.push(university_id);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY created_at DESC';
    
    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ success: false, error: 'Failed to get media' });
  }
});

// GET /api/media/:id - Get single media item
router.get('/:id', async (req, res) => {
  const pool = await getPool();
  try {
    const { rows } = await pool.query('SELECT * FROM media WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Media not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ success: false, error: 'Failed to get media' });
  }
});

// POST /api/media - Create new media record
router.post('/', authenticateToken, requirePermission('create', 'media'), async (req, res) => {
  const pool = await getPool();
  try {
    const { name, url, type, university_id, university_name, size, mime_type } = req.body;
    
    if (!name || !url || !type) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    
    const { rows } = await pool.query(
      `INSERT INTO media (id, name, url, type, university_id, university_name, size, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, name, url, type, university_id || null, university_name || null, size || '0 KB', mime_type || null, req.user?.email || 'unknown']
    );
    
    res.json({ success: true, data: rows[0], message: 'Media uploaded successfully' });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload media' });
  }
});

// DELETE /api/media/:id - Delete media item
router.delete('/:id', authenticateToken, requirePermission('delete', 'media'), async (req, res) => {
  const pool = await getPool();
  try {
    const { rows } = await pool.query(
      'DELETE FROM media WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Media not found' });
    }
    
    res.json({ success: true, message: 'Media deleted', data: rows[0] });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete media' });
  }
});

// PUT /api/media/:id - Update media metadata
router.put('/:id', authenticateToken, requirePermission('edit', 'media'), async (req, res) => {
  const pool = await getPool();
  try {
    const { name, university_id, university_name } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (university_id !== undefined) {
      updates.push(`university_id = $${paramCount++}`);
      values.push(university_id);
    }
    if (university_name !== undefined) {
      updates.push(`university_name = $${paramCount++}`);
      values.push(university_name);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    values.push(req.params.id);
    const query = `UPDATE media SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;
    
    const { rows } = await pool.query(query, values);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Media not found' });
    }
    
    res.json({ success: true, data: rows[0], message: 'Media updated' });
  } catch (error) {
    console.error('Update media error:', error);
    res.status(500).json({ success: false, error: 'Failed to update media' });
  }
});

export default router;
