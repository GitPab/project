import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// ============================================
// DEFAULT CONFIGURATION (fallback if .env missing)
// ============================================
process.env.PORT = process.env.PORT || '3001';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/sacma';

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 login/register attempts per 15 minutes
  message: { error: 'Too many auth attempts, please try again later' },
});

app.use(limiter); // Apply to all routes
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Supabase client
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

// PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => { // Removed fallback
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ============================================
// RBAC PERMISSIONS CONFIGURATION
// ============================================
const ROLE_DEFINITIONS = {
  super_admin: {
    permissions: ['*'], // All permissions
  },
  admin: {
    permissions: ['*'], // Same as super_admin - full access
  },
  admin_manager: {
    permissions: [
      'university:view',
      'student:view', 'student:edit', 'student:progress',
      'application:view', 'application:manage',
      'payment:view',
      'analytics:view',
    ],
  },
  content_editor: {
    permissions: [
      'university:view', 'university:create', 'university:edit',
      'student:view',
      'application:view',
    ],
  },
  finance_admin: {
    permissions: [
      'university:view',
      'student:view',
      'application:view',
      'payment:view', 'payment:create', 'payment:approve',
      'analytics:view',
    ],
  },
  viewer: {
    permissions: [
      'university:view',
      'student:view',
      'application:view',
      'payment:view',
      'analytics:view',
    ],
  },
};

// Check if user has permission
function hasPermission(userRole, action, resource) {
  const roleDef = ROLE_DEFINITIONS[userRole];
  if (!roleDef) return false;
  if (roleDef.permissions.includes('*')) return true;
  return roleDef.permissions.includes(`${action}:${resource}`);
}

// Permission middleware factory
const requirePermission = (action, resource) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!hasPermission(req.user.role, action, resource)) {
      return res.status(403).json({ error: `Permission denied: ${action}:${resource}` });
    }
    next();
  };
};

// Legacy admin check (backward compatibility)
const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const adminRoles = ['admin', 'super_admin', 'admin_manager', 'content_editor', 'finance_admin', 'viewer'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ============================================
// ADMIN INVITE SYSTEM - Add to database schema
// ============================================
async function initializeDatabase() {
  try {
    // Update users table with extended roles and invite system
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL, 
        email TEXT UNIQUE NOT NULL,
        phone TEXT, 
        password TEXT NOT NULL, 
        role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin', 'super_admin', 'admin_manager', 'content_editor', 'finance_admin', 'viewer')),
        is_first_login BOOLEAN DEFAULT false,
        setup_token TEXT,
        setup_token_expiry TIMESTAMP,
        invited_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add invite system columns if they don't exist
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS setup_token TEXT,
      ADD COLUMN IF NOT EXISTS setup_token_expiry TIMESTAMP,
      ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS phone TEXT;
    `);
    
    // Create index for setup token lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_setup_token ON users(setup_token) WHERE is_first_login = true;
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS universities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL, korean_name TEXT, region TEXT,
        country TEXT DEFAULT 'Hàn Quốc', ranking INTEGER, top_tier TEXT,
        location TEXT, hero_image TEXT, thumbnail TEXT, korean_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
        visa_system TEXT, status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Database ready');
  } catch (err) {
    console.error('❌ DB init error:', err);
  }
}

initializeDatabase();

// Auth routes - SECURE VERSION
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be 6+ characters' });
  
  try {
    // Check if any users exist - first user becomes admin
    const { rows: existingUsers } = await pool.query('SELECT COUNT(*) as count FROM users');
    const isFirstUser = existingUsers[0].count === '0';
    const role = isFirstUser ? 'admin' : 'student';
    
    const hash = await bcrypt.hash(password, 12); // Increased from 10 to 12
    const id = uuidv4();
    const { rows } = await pool.query(
      'INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
      [id, name, email, hash, role]
    );
    const token = jwt.sign(rows[0], process.env.JWT_SECRET, { expiresIn: '24h' }); // Removed fallback
    res.status(201).json({ user: rows[0], token });
  } catch (e) {
    res.status(409).json({ error: 'Email exists' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (!rows[0] || !await bcrypt.compare(password, rows[0].password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const user = { id: rows[0].id, name: rows[0].name, email: rows[0].email, role: rows[0].role };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '24h' }); // Removed fallback
  res.json({ user, token });
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]);
  res.json(rows[0]);
});

// Image upload - Supabase primary, Imgur fallback
app.post('/api/upload', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file' });

  // Try Supabase first
  if (supabase) {
    try {
      const filename = `${uuidv4()}-${req.file.originalname}`;
      const { data, error } = await supabase.storage.from('university-images').upload(filename, req.file.buffer, { contentType: req.file.mimetype });
      if (!error) {
        const { data: urlData } = supabase.storage.from('university-images').getPublicUrl(filename);
        return res.json({ url: urlData.publicUrl });
      }
    } catch (e) {
      console.log('Supabase failed, trying Imgur...');
    }
  }

  // Fallback to Imgur
  try {
    const base64 = req.file.buffer.toString('base64');
    const response = await axios.post('https://api.imgur.com/3/image', 
      { image: base64, type: 'base64' },
      { headers: { Authorization: 'Client-ID 546c25a59c58ad7' } }
    );
    res.json({ url: response.data.data.link });
  } catch (e) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// University routes with RBAC
app.get('/api/universities', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM universities ORDER BY created_at DESC');
  res.json(rows.map(r => ({ ...r, koreanData: r.korean_data ? JSON.parse(r.korean_data) : {} })));
});

app.get('/api/universities/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM universities WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json({ ...rows[0], koreanData: rows[0].korean_data ? JSON.parse(rows[0].korean_data) : {} });
});

// Create university - requires university:create permission
app.post('/api/universities', authenticateToken, requirePermission('create', 'university'), async (req, res) => {
  const { name, koreanName, region, heroImage, thumbnail, koreanData } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO universities (id, name, korean_name, region, hero_image, thumbnail, korean_data) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
    [uuidv4(), name, koreanName, region, heroImage, thumbnail, JSON.stringify(koreanData || {})]
  );
  res.status(201).json({ id: rows[0].id });
});

// Edit university - requires university:edit permission
app.put('/api/universities/:id', authenticateToken, requirePermission('edit', 'university'), async (req, res) => {
  const { name, koreanName, region, heroImage, thumbnail, koreanData } = req.body;
  await pool.query(
    'UPDATE universities SET name=$1, korean_name=$2, region=$3, hero_image=$4, thumbnail=$5, korean_data=$6, updated_at=NOW() WHERE id=$7',
    [name, koreanName, region, heroImage, thumbnail, JSON.stringify(koreanData || {}), req.params.id]
  );
  res.json({ message: 'Updated' });
});

// Delete university - requires university:delete permission (super_admin only by default)
app.delete('/api/universities/:id', authenticateToken, requirePermission('delete', 'university'), async (req, res) => {
  await pool.query('DELETE FROM universities WHERE id = $1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// Registration routes with RBAC
app.get('/api/registrations', authenticateToken, requirePermission('view', 'application'), async (req, res) => {
  const hasFullAccess = hasPermission(req.user.role, 'manage', 'application');
  const query = hasFullAccess
    ? `SELECT r.*, u.name as student_name, un.name as university_name FROM registrations r JOIN users u ON r.student_id = u.id JOIN universities un ON r.university_id = un.id ORDER BY r.created_at DESC`
    : `SELECT r.*, un.name as university_name FROM registrations r JOIN universities un ON r.university_id = un.id WHERE r.student_id = $1 ORDER BY r.created_at DESC`;
  const { rows } = await pool.query(query, hasFullAccess ? [] : [req.user.id]);
  res.json(rows);
});

app.post('/api/registrations', authenticateToken, async (req, res) => {
  const { universityId, visaSystem } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO registrations (id, student_id, university_id, visa_system) VALUES ($1, $2, $3, $4) RETURNING id',
    [uuidv4(), req.user.id, universityId, visaSystem]
  );
  res.status(201).json({ id: rows[0].id });
});

// ============================================
// ADMIN INVITE API - Create users without registration
// ============================================

// Only super_admin can invite other admins
const requireInvitePermission = (req, res, next) => {
  const allowedRoles = ['super_admin', 'admin'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Permission denied: Can not invite users' });
  }
  next();
};

// POST /api/admin/invite - Invite new admin user
app.post('/api/admin/invite', authenticateToken, requireInvitePermission, async (req, res) => {
  const { email, name, role, phone } = req.body;
  
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
    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Generate setup token
    const setupToken = uuidv4() + uuidv4(); // 64 char random token
    const setupTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const tempPassword = await bcrypt.hash(setupToken, 12); // Use token as temp password
    
    const userId = uuidv4();
    
    // Create user with is_first_login flag
    await pool.query(
      `INSERT INTO users (id, name, email, phone, password, role, is_first_login, setup_token, setup_token_expiry, invited_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
      [userId, name, email.toLowerCase(), phone || null, tempPassword, role, true, setupToken, setupTokenExpiry, req.user.id]
    );
    
    // Generate setup link
    const setupUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/first-time-setup?token=${setupToken}&email=${encodeURIComponent(email)}`;
    
    res.status(201).json({
      message: 'User invited successfully',
      user: { id: userId, email, name, role, isFirstLogin: true },
      setupUrl // In production, send this via email instead
    });
    
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ error: 'Failed to create invited user' });
  }
});

// GET /api/admin/invited-users - List pending invitations
app.get('/api/admin/invited-users', authenticateToken, requireInvitePermission, async (req, res) => {
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

// POST /api/auth/verify-setup-token - Verify setup token
app.post('/api/auth/verify-setup-token', async (req, res) => {
  const { token, email } = req.body;
  
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
    if (new Date() > new Date(user.setup_token_expiry)) {
      return res.status(410).json({ error: 'Setup token expired' });
    }
    
    res.json({ valid: true, email: user.email });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

// POST /api/auth/set-password - Set password for first-time login
app.post('/api/auth/set-password', async (req, res) => {
  const { token, email, password } = req.body;
  
  if (!token || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
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
    
    res.json({
      message: 'Password set successfully',
      token: authToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ error: 'Failed to set password' });
  }
});

// POST /api/admin/resend-invite - Resend invitation
app.post('/api/admin/resend-invite', authenticateToken, requireInvitePermission, async (req, res) => {
  const { userId } = req.body;
  
  try {
    const setupToken = uuidv4() + uuidv4();
    const setupTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const tempPassword = await bcrypt.hash(setupToken, 12);
    
    const { rows } = await pool.query(
      `UPDATE users 
       SET setup_token = $1, setup_token_expiry = $2, password = $3, updated_at = NOW()
       WHERE id = $4 AND is_first_login = true
       RETURNING email, name, role`,
      [setupToken, setupTokenExpiry, tempPassword, userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found or already activated' });
    }
    
    const user = rows[0];
    const setupUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/first-time-setup?token=${setupToken}&email=${encodeURIComponent(user.email)}`;
    
    res.json({ message: 'Invitation resent', setupUrl, user });
  } catch (error) {
    console.error('Resend invite error:', error);
    res.status(500).json({ error: 'Failed to resend invitation' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server: http://localhost:${PORT}/api`);
  console.log(process.env.DATABASE_URL ? '✅ PostgreSQL ready' : '❌ No DATABASE_URL');
  console.log(supabase ? '✅ Supabase ready' : '⚠️ Using Imgur only');
});

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});
