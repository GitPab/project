/**
 * Authentication Routes
 * Handles login, register, logout, token verification
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../dbAdapter.js';
import { logger } from '../logger.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

// Rate limiting middleware (applied in server.js)
// authLimiter: 10 requests per 15 minutes

/**
 * POST /api/auth/register
 * Register new user - first user becomes admin
 */
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, password required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be 6+ characters' });
  }
  
  const pool = await getPool();
  const DB_TYPE = process.env.DB_TYPE || 'postgresql';
  
  try {
    // Check if any users exist - first user becomes admin
    const { rows: existingUsers } = await pool.query('SELECT COUNT(*) as count FROM users');
    const isFirstUser = parseInt(existingUsers[0].count) === 0;
    const role = isFirstUser ? 'admin' : 'student';
    
    const hash = await bcrypt.hash(password, 12);
    const id = uuidv4();
    
    // Database-specific insert
    if (DB_TYPE === 'mysql') {
      await pool.query(
        'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
        [id, name, email, hash, role]
      );
      // Fetch the inserted user
      const { rows } = await pool.query(
        'SELECT id, name, email, role FROM users WHERE id = ?',
        [id]
      );
      const token = jwt.sign(rows[0], process.env.JWT_SECRET, { expiresIn: '24h' });
      logger.info('User registered', { userId: id, email, role });
      res.status(201).json({ user: rows[0], token });
    } else {
      // PostgreSQL
      const { rows } = await pool.query(
        'INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
        [id, name, email, hash, role]
      );
      const token = jwt.sign(rows[0], process.env.JWT_SECRET, { expiresIn: '24h' });
      logger.info('User registered', { userId: id, email, role });
      res.status(201).json({ user: rows[0], token });
    }
  } catch (e) {
    if (e.message?.includes('unique constraint') || e.message?.includes('duplicate key') || e.message?.includes('Duplicate entry')) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    logger.error('Registration failed', { error: e.message, email });
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  const pool = await getPool();
  const DB_TYPE = process.env.DB_TYPE || 'postgresql';
  
  try {
    // Database-specific query
    let rows;
    if (DB_TYPE === 'mysql') {
      console.log('[DEBUG] MySQL login query for:', email);
      const result = await pool.query(
        'SELECT * FROM users WHERE email = ? AND (is_active = 1 OR is_active IS NULL)',
        [email]
      );
      console.log('[DEBUG] MySQL result:', result);
      rows = result.rows;
    } else {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [email]
      );
      rows = result.rows;
    }
    
    console.log('[DEBUG] Found user:', rows[0] ? 'YES' : 'NO');
    
    if (!rows[0] || !await bcrypt.compare(password, rows[0].password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last_login timestamp
    if (DB_TYPE === 'mysql') {
      await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [rows[0].id]);
    } else {
      await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [rows[0].id]);
    }
    
    const user = { 
      id: rows[0].id, 
      name: rows[0].name, 
      email: rows[0].email, 
      role: rows[0].role, 
      last_login: new Date() 
    };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    logger.info('User logged in', { userId: user.id, email });
    res.json({ user, token });
  } catch (e) {
    console.error('[DEBUG] Login error:', e);
    console.error('[DEBUG] Error stack:', e.stack);
    logger.error('Login failed', { error: e.message, email });
    res.status(500).json({ error: 'Login failed: ' + e.message });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client clears token)
 */
router.post('/logout', async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // But we can log the action if user info is available
  if (req.user) {
    await logAudit(req, 'LOGOUT', 'user', req.user.id, null, null);
    logger.info('User logged out', { userId: req.user.id, email: req.user.email });
  }
  res.json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, last_login FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(rows[0]);
  } catch (e) {
    logger.error('Failed to get user profile', { error: e.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * POST /api/auth/verify-setup-token
 * Verify first-time setup token for invited users
 */
router.post('/verify-setup-token', async (req, res) => {
  const { token, email } = req.body;
  
  if (!token || !email) {
    return res.status(400).json({ error: 'Token and email required' });
  }
  
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      `SELECT id, email, is_first_login, setup_token_expiry 
       FROM users 
       WHERE email = $1 AND setup_token = $2 AND is_first_login = true`,
      [email.toLowerCase(), token]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired setup token' });
    }
    
    const user = rows[0];
    if (new Date() > new Date(user.setup_token_expiry)) {
      return res.status(410).json({ error: 'Setup token expired' });
    }
    
    res.json({ valid: true, email: user.email });
  } catch (error) {
    logger.error('Verify token error', { error: error.message });
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

/**
 * POST /api/auth/set-password
 * Set password for first-time login
 */
router.post('/set-password', async (req, res) => {
  const { token, email, password } = req.body;
  
  if (!token || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  const pool = await getPool();
  
  try {
    // Verify token
    const { rows } = await pool.query(
      `SELECT id, email, is_first_login, setup_token_expiry, role, name
       FROM users 
       WHERE email = $1 AND setup_token = $2 AND is_first_login = true`,
      [email.toLowerCase(), token]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Invalid setup token' });
    }
    
    const user = rows[0];
    if (new Date() > new Date(user.setup_token_expiry)) {
      return res.status(410).json({ error: 'Setup token expired' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Update user
    await pool.query(
      `UPDATE users 
       SET password = $1, is_first_login = false, setup_token = NULL, setup_token_expiry = NULL, updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, user.id]
    );
    
    // Generate JWT for immediate login
    const authToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    logger.info('Password set for invited user', { userId: user.id, email });
    res.json({
      message: 'Password set successfully',
      token: authToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    logger.error('Set password error', { error: error.message });
    res.status(500).json({ error: 'Failed to set password' });
  }
});

export default router;
