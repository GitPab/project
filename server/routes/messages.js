/**
 * Messages API Routes
 * Internal messaging system
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../dbAdapter.js';
import { logger } from '../logger.js';
import { hasPermission } from '../utils/rbac.js';

const router = express.Router();

/**
 * GET /api/messages
 * Get user's messages (inbox)
 */
router.get('/', async (req, res) => {
  const pool = await getPool();
  const { type = 'inbox', limit = 20, offset = 0 } = req.query;
  
  try {
    let query;
    const params = [req.user.id, parseInt(limit), parseInt(offset)];
    
    if (type === 'inbox') {
      query = `
        SELECT m.*, u.name as sender_name 
        FROM messages m 
        JOIN users u ON m.sender_id = u.id 
        WHERE m.recipient_id = $1 
        AND m.is_deleted_by_recipient = false 
        ORDER BY m.created_at DESC 
        LIMIT $2 OFFSET $3
      `;
    } else if (type === 'sent') {
      query = `
        SELECT m.*, u.name as recipient_name 
        FROM messages m 
        JOIN users u ON m.recipient_id = u.id 
        WHERE m.sender_id = $1 
        AND m.is_deleted_by_sender = false 
        ORDER BY m.created_at DESC 
        LIMIT $2 OFFSET $3
      `;
    }
    
    const { rows } = await pool.query(query, params);
    
    // Get unread count
    const { rows: countResult } = await pool.query(
      'SELECT COUNT(*) as unread_count FROM messages WHERE recipient_id = $1 AND is_read = false AND is_deleted_by_recipient = false',
      [req.user.id]
    );
    
    res.json({
      messages: rows,
      unread_count: parseInt(countResult[0].unread_count)
    });
  } catch (error) {
    logger.error('Failed to fetch messages', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * GET /api/messages/:id
 * Get single message
 */
router.get('/:id', async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      `SELECT m.*, 
        s.name as sender_name, 
        r.name as recipient_name 
       FROM messages m 
       JOIN users s ON m.sender_id = s.id 
       JOIN users r ON m.recipient_id = r.id 
       WHERE m.id = $1 
       AND (m.sender_id = $2 OR m.recipient_id = $2)`,
      [req.params.id, req.user.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Mark as read if recipient
    if (rows[0].recipient_id === req.user.id && !rows[0].is_read) {
      await pool.query(
        'UPDATE messages SET is_read = true, read_at = NOW() WHERE id = $1',
        [req.params.id]
      );
    }
    
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to fetch message', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

/**
 * POST /api/messages
 * Send message
 */
router.post('/', async (req, res) => {
  const { recipient_id, subject, content, parent_id } = req.body;
  
  if (!recipient_id || !content) {
    return res.status(400).json({ error: 'Recipient ID and content are required' });
  }
  
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      `INSERT INTO messages (id, sender_id, recipient_id, subject, content, parent_id, is_read, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW()) 
       RETURNING *`,
      [uuidv4(), req.user.id, recipient_id, subject || null, content, parent_id || null]
    );
    
    logger.info('Message sent', { messageId: rows[0].id, senderId: req.user.id, recipientId: recipient_id });
    res.status(201).json(rows[0]);
  } catch (error) {
    logger.error('Failed to send message', { error: error.message });
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * DELETE /api/messages/:id
 * Delete message (soft delete)
 */
router.delete('/:id', async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      'SELECT sender_id, recipient_id FROM messages WHERE id = $1',
      [req.params.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    const msg = rows[0];
    
    if (msg.sender_id === req.user.id) {
      await pool.query(
        'UPDATE messages SET is_deleted_by_sender = true WHERE id = $1',
        [req.params.id]
      );
    } else if (msg.recipient_id === req.user.id) {
      await pool.query(
        'UPDATE messages SET is_deleted_by_recipient = true WHERE id = $1',
        [req.params.id]
      );
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    logger.info('Message deleted', { id: req.params.id, userId: req.user.id });
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete message', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
