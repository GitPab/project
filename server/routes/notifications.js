/**
 * Notifications API Routes
 * System alerts and notifications for users
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../dbAdapter.js';
import { logger } from '../logger.js';
import { hasPermission } from '../utils/rbac.js';

const router = express.Router();

/**
 * GET /api/notifications
 * Get notifications for current user
 */
router.get('/', async (req, res) => {
  const pool = await getPool();
  const { limit = 20, offset = 0, unread_only = false } = req.query;
  
  try {
    let query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ${unread_only === 'true' ? 'AND is_read = false' : ''}
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    
    const { rows } = await pool.query(query, [req.user.id, parseInt(limit), parseInt(offset)]);
    
    // Get unread count
    const { rows: countResult } = await pool.query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    
    res.json({
      notifications: rows,
      unread_count: parseInt(countResult[0].unread_count),
      total: rows.length
    });
  } catch (error) {
    logger.error('Failed to fetch notifications', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    
    res.json({ count: parseInt(rows[0].count) });
  } catch (error) {
    logger.error('Failed to fetch unread count', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

/**
 * POST /api/notifications
 * Create notification (admin only)
 */
router.post('/', async (req, res) => {
  const hasFullAccess = hasPermission(req.user.role, 'manage', 'notification');
  
  if (!hasFullAccess) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { user_id, type = 'info', title, message, link } = req.body;
  
  if (!user_id || !title || !message) {
    return res.status(400).json({ error: 'User ID, title, and message are required' });
  }
  
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      `INSERT INTO notifications (id, user_id, type, title, message, link, is_read, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW()) 
       RETURNING *`,
      [uuidv4(), user_id, type, title, message, link || null]
    );
    
    logger.info('Notification created', { notificationId: rows[0].id, userId: user_id });
    res.status(201).json(rows[0]);
  } catch (error) {
    logger.error('Failed to create notification', { error: error.message, userId });
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

/**
 * POST /api/notifications/broadcast
 * Broadcast notification to multiple users (admin only)
 */
router.post('/broadcast', async (req, res) => {
  const hasFullAccess = hasPermission(req.user.role, 'manage', 'notification');
  
  if (!hasFullAccess) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { user_ids, type = 'info', title, message, link } = req.body;
  
  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0 || !title || !message) {
    return res.status(400).json({ error: 'User IDs array, title, and message are required' });
  }
  
  const pool = await getPool();
  
  try {
    const notifications = [];
    
    for (const userId of user_ids) {
      const { rows } = await pool.query(
        `INSERT INTO notifications (id, user_id, type, title, message, link, is_read, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, false, NOW()) 
         RETURNING *`,
        [uuidv4(), userId, type, title, message, link || null]
      );
      notifications.push(rows[0]);
    }
    
    logger.info('Broadcast notifications created', { count: notifications.length });
    res.status(201).json({ count: notifications.length, notifications });
  } catch (error) {
    logger.error('Failed to broadcast notifications', { error: error.message });
    res.status(500).json({ error: 'Failed to broadcast notifications' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW() 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [req.params.id, req.user.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to mark notification as read', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read
 */
router.put('/mark-all-read', async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rowCount } = await pool.query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW() 
       WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );
    
    logger.info('All notifications marked as read', { userId: req.user.id, count: rowCount });
    res.json({ message: `${rowCount} notifications marked as read` });
  } catch (error) {
    logger.error('Failed to mark all as read', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
router.delete('/:id', async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    logger.info('Notification deleted', { id: req.params.id, userId: req.user.id });
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete notification', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

/**
 * DELETE /api/notifications/clear-all
 * Clear all read notifications
 */
router.delete('/clear-all', async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM notifications WHERE user_id = $1 AND is_read = true',
      [req.user.id]
    );
    
    logger.info('Read notifications cleared', { userId: req.user.id, count: rowCount });
    res.json({ message: `${rowCount} read notifications deleted` });
  } catch (error) {
    logger.error('Failed to clear notifications', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

export default router;
