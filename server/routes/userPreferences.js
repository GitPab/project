/**
 * User Preferences API Routes
 * User settings and preferences
 */

import express from 'express';
import { getPool } from '../dbAdapter.js';
import { logger } from '../logger.js';

const router = express.Router();

/**
 * GET /api/user-preferences
 * Get current user's preferences
 */
router.get('/', async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!rows[0]) {
      // Return default preferences
      return res.json({
        user_id: req.user.id,
        language: 'vi',
        theme: 'light',
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        timezone: 'Asia/Ho_Chi_Minh',
        date_format: 'DD/MM/YYYY'
      });
    }
    
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to fetch user preferences', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch user preferences' });
  }
});

/**
 * POST /api/user-preferences
 * Create or update user preferences
 */
router.post('/', async (req, res) => {
  const pool = await getPool();
  const userId = req.user.id;
  
  const {
    language,
    theme,
    email_notifications,
    sms_notifications,
    push_notifications,
    timezone,
    date_format,
    preferences_data
  } = req.body;
  
  try {
    // Check if preferences exist
    const { rows: existing } = await pool.query(
      'SELECT id FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    
    let result;
    
    if (existing[0]) {
      // Update
      const { rows } = await pool.query(
        `UPDATE user_preferences SET
          language = COALESCE($1, language),
          theme = COALESCE($2, theme),
          email_notifications = COALESCE($3, email_notifications),
          sms_notifications = COALESCE($4, sms_notifications),
          push_notifications = COALESCE($5, push_notifications),
          timezone = COALESCE($6, timezone),
          date_format = COALESCE($7, date_format),
          preferences_data = COALESCE($8, preferences_data),
          updated_at = NOW()
         WHERE user_id = $9 RETURNING *`,
        [
          language, theme, email_notifications, sms_notifications,
          push_notifications, timezone, date_format,
          preferences_data ? JSON.stringify(preferences_data) : null,
          userId
        ]
      );
      result = rows[0];
      logger.info('User preferences updated', { userId });
    } else {
      // Create
      const { rows } = await pool.query(
        `INSERT INTO user_preferences (
          user_id, language, theme, email_notifications, sms_notifications,
          push_notifications, timezone, date_format, preferences_data, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *`,
        [
          userId, language || 'vi', theme || 'light', email_notifications !== false,
          sms_notifications || false, push_notifications !== false,
          timezone || 'Asia/Ho_Chi_Minh', date_format || 'DD/MM/YYYY',
          preferences_data ? JSON.stringify(preferences_data) : null
        ]
      );
      result = rows[0];
      logger.info('User preferences created', { userId });
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Failed to save user preferences', { error: error.message, userId });
    res.status(500).json({ error: 'Failed to save user preferences' });
  }
});

/**
 * PUT /api/user-preferences
 * Update specific preferences
 */
router.put('/', async (req, res) => {
  const pool = await getPool();
  const userId = req.user.id;
  
  try {
    const allowedFields = [
      'language', 'theme', 'email_notifications', 'sms_notifications',
      'push_notifications', 'timezone', 'date_format', 'preferences_data'
    ];
    
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(req.body)) {
      if (allowedFields.includes(key)) {
        if (key === 'preferences_data' && value) {
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
    params.push(userId);
    
    const { rows } = await pool.query(
      `UPDATE user_preferences SET ${updates.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
      params
    );
    
    if (!rows[0]) {
      // Create if not exists
      return res.status(404).json({ error: 'Preferences not found. Use POST to create.' });
    }
    
    logger.info('User preferences updated', { userId });
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to update user preferences', { error: error.message, userId });
    res.status(500).json({ error: 'Failed to update user preferences' });
  }
});

export default router;
