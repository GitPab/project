// ============================================
// ADMIN INVITE SYSTEM - Backend API
// Create users without registration, first-time password setup
// ============================================

import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const router = express.Router();

// ============================================
// MIDDLEWARE
// ============================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Only super_admin or admin with USER_MANAGE permission can invite
const requireInvitePermission = (req, res, next) => {
  const allowedRoles = ['super_admin', 'admin'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Permission denied: Can not invite users' });
  }
  next();
};

// ============================================
// INVITE API - Create user without registration
// ============================================

// POST /api/admin/invite - Create invited user
router.post('/admin/invite', authenticateToken, requireInvitePermission, async (req, res) => {
  const { email, name, role, phone } = req.body;
  const pool = req.app.locals.pool;
  
  if (!email || !name || !role) {
    return res.status(400).json({ error: 'Email, name, and role are required' });
  }
  
  // Valid admin roles that can be invited
  const validRoles = ['admin_manager', 'content_editor', 'finance_admin', 'viewer', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role for invitation' });
  }
  
  try {
    // Check if email already exists
    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Generate temporary password and setup token
    const tempPassword = generateTempPassword();
    const setupToken = generateSetupToken();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    
    const userId = uuidv4();
    const now = new Date();
    const setupTokenExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Create user with is_first_login flag
    await pool.query(
      `INSERT INTO users (id, name, email, phone, password, role, is_first_login, setup_token, setup_token_expiry, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [userId, name, email.toLowerCase(), phone || null, hashedPassword, role, true, setupToken, setupTokenExpiry, now, now]
    );
    
    // TODO: Send email with setup link
    // For now, return the setup link in response (for testing)
    const setupUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/first-time-setup?token=${setupToken}&email=${encodeURIComponent(email)}`;
    
    res.status(201).json({
      message: 'User invited successfully',
      user: {
        id: userId,
        email,
        name,
        role,
        isFirstLogin: true
      },
      setupUrl, // Remove in production - send via email instead
      tempPassword // Remove in production - for testing only
    });
    
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ error: 'Failed to create invited user' });
  }
});

// GET /api/admin/invited-users - List invited users pending first login
router.get('/admin/invited-users', authenticateToken, requireInvitePermission, async (req, res) => {
  const pool = req.app.locals.pool;
  
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, is_first_login, setup_token_expiry, created_at 
       FROM users 
       WHERE is_first_login = true 
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching invited users:', error);
    res.status(500).json({ error: 'Failed to fetch invited users' });
  }
});

// ============================================
// FIRST-TIME SETUP API
// ============================================

// POST /api/auth/verify-setup-token - Verify if setup token is valid
router.post('/auth/verify-setup-token', async (req, res) => {
  const { token, email } = req.body;
  const pool = req.app.locals.pool;
  
  if (!token || !email) {
    return res.status(400).json({ error: 'Token and email required' });
  }
  
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
    
    // Check if token expired
    if (new Date() > new Date(user.setup_token_expiry)) {
      return res.status(410).json({ error: 'Setup token expired. Please request a new invitation.' });
    }
    
    res.json({ valid: true, email: user.email });
    
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

// POST /api/auth/set-password - Set password for first-time login
router.post('/auth/set-password', async (req, res) => {
  const { token, email, password } = req.body;
  const pool = req.app.locals.pool;
  
  if (!token || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  try {
    // Verify token is valid and not expired
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
    const now = new Date();
    
    // Update user: set password, clear first_login flag and setup token
    await pool.query(
      `UPDATE users 
       SET password = $1, 
           is_first_login = false, 
           setup_token = NULL, 
           setup_token_expiry = NULL,
           updated_at = $2
       WHERE id = $3`,
      [hashedPassword, now, user.id]
    );
    
    // Generate JWT token for immediate login
    const authToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Password set successfully',
      token: authToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ error: 'Failed to set password' });
  }
});

// ============================================
// RESEND INVITE
// ============================================

// POST /api/admin/resend-invite - Resend invitation (new token)
router.post('/admin/resend-invite', authenticateToken, requireInvitePermission, async (req, res) => {
  const { userId } = req.body;
  const pool = req.app.locals.pool;
  
  try {
    // Generate new setup token
    const setupToken = generateSetupToken();
    const setupTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const { rows } = await pool.query(
      `UPDATE users 
       SET setup_token = $1, setup_token_expiry = $2, updated_at = NOW()
       WHERE id = $3 AND is_first_login = true
       RETURNING email, name, role`,
      [setupToken, setupTokenExpiry, userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found or already activated' });
    }
    
    const user = rows[0];
    const setupUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/first-time-setup?token=${setupToken}&email=${encodeURIComponent(user.email)}`;
    
    res.json({
      message: 'Invitation resent',
      setupUrl, // Send via email in production
      user
    });
    
  } catch (error) {
    console.error('Resend invite error:', error);
    res.status(500).json({ error: 'Failed to resend invitation' });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateTempPassword() {
  // Generate a secure temporary password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function generateSetupToken() {
  // Generate a secure random token
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// ============================================
// DATABASE MIGRATION - Add required columns
// ============================================

export const INVITE_SYSTEM_MIGRATION = `
-- Add invite system columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS setup_token TEXT,
ADD COLUMN IF NOT EXISTS setup_token_expiry TIMESTAMP,
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update role constraint to include new roles
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check,
ADD CONSTRAINT users_role_check 
CHECK (role IN ('student', 'admin', 'super_admin', 'admin_manager', 'content_editor', 'finance_admin', 'viewer'));

-- Create index for setup token lookups
CREATE INDEX IF NOT EXISTS idx_users_setup_token ON users(setup_token) WHERE is_first_login = true;
`;

export default router;
export { authenticateToken, requireInvitePermission };
