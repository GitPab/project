import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import pkg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Cloudflare R2 Configuration
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'sacma-images';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

// Initialize S3 client for R2
const s3Client = R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
  ? new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

// PostgreSQL Database Setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create universities table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS universities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        korean_name TEXT,
        region TEXT,
        country TEXT DEFAULT 'Hàn Quốc',
        ranking INTEGER,
        top_tier TEXT,
        location TEXT,
        hero_image TEXT,
        thumbnail TEXT,
        korean_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create registrations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
        visa_system TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ PostgreSQL tables initialized');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
  }
}

// Initialize DB on startup
initializeDatabase();

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ==================== AUTH ROUTES ====================

app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    const result = await pool.query(
      'INSERT INTO users (id, name, email, phone, password, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, phone, role',
      [id, name, email, phone, hashedPassword, role || 'student']
    );
    
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({ user, token });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, phone, role FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== IMAGE UPLOAD ====================

app.post('/api/upload', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });

  // Fallback to local storage if R2 not configured
  if (!s3Client) {
    const filename = `${uuidv4()}-${req.file.originalname}`;
    const filepath = path.join(uploadsDir, filename);
    
    try {
      fs.writeFileSync(filepath, req.file.buffer);
      return res.json({ 
        url: `/uploads/${filename}`,
        message: 'Image saved locally (R2 not configured)'
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to save image' });
    }
  }

  try {
    const filename = `${uuidv4()}-${req.file.originalname}`;
    const key = `universities/${filename}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    const publicUrl = R2_PUBLIC_URL 
      ? `${R2_PUBLIC_URL}/${key}`
      : `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`;

    res.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload to R2' });
  }
});

app.delete('/api/upload', authenticateToken, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Image URL is required' });

  // If using local storage
  if (url.startsWith('/uploads/')) {
    const filename = path.basename(url);
    const filepath = path.join(uploadsDir, filename);
    
    try {
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      return res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete local image' });
    }
  }

  if (!s3Client) return res.status(500).json({ error: 'R2 not configured' });

  try {
    const urlObj = new URL(url);
    const key = urlObj.pathname.substring(1);
    await s3Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete image from R2' });
  }
});

app.use('/uploads', express.static(uploadsDir));

// ==================== UNIVERSITY ROUTES ====================

app.get('/api/universities', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM universities ORDER BY created_at DESC');
    const universities = result.rows.map(row => ({
      ...row,
      koreanData: row.korean_data ? JSON.parse(row.korean_data) : {},
      heroImage: row.hero_image,
      thumbnail: row.thumbnail
    }));
    res.json(universities);
  } catch (error) {
    console.error('Get universities error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/universities/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM universities WHERE id = $1', [req.params.id]);
    const row = result.rows[0];
    
    if (!row) return res.status(404).json({ error: 'University not found' });
    
    res.json({
      ...row,
      koreanData: row.korean_data ? JSON.parse(row.korean_data) : {},
      heroImage: row.hero_image,
      thumbnail: row.thumbnail
    });
  } catch (error) {
    console.error('Get university error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/universities', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const { name, koreanName, region, country, ranking, topTier, location, heroImage, thumbnail, koreanData } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO universities (id, name, korean_name, region, country, ranking, top_tier, location, hero_image, thumbnail, korean_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [uuidv4(), name, koreanName, region, country, ranking, topTier, location, heroImage, thumbnail, JSON.stringify(koreanData || {})]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'University created successfully' });
  } catch (error) {
    console.error('Create university error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/universities/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const { name, koreanName, region, country, ranking, topTier, location, heroImage, thumbnail, koreanData } = req.body;

  try {
    const result = await pool.query(
      `UPDATE universities SET
        name = $1, korean_name = $2, region = $3, country = $4, ranking = $5,
        top_tier = $6, location = $7, hero_image = $8, thumbnail = $9, korean_data = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 RETURNING id`,
      [name, koreanName, region, country, ranking, topTier, location, heroImage, thumbnail, JSON.stringify(koreanData || {}), req.params.id]
    );
    
    if (result.rowCount === 0) return res.status(404).json({ error: 'University not found' });
    res.json({ message: 'University updated successfully' });
  } catch (error) {
    console.error('Update university error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/universities/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  try {
    const result = await pool.query('DELETE FROM universities WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'University not found' });
    res.json({ message: 'University deleted successfully' });
  } catch (error) {
    console.error('Delete university error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== REGISTRATION ROUTES ====================

app.get('/api/registrations', authenticateToken, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query(`
        SELECT r.*, u.name as student_name, un.name as university_name 
        FROM registrations r 
        JOIN users u ON r.student_id = u.id 
        JOIN universities un ON r.university_id = un.id 
        ORDER BY r.created_at DESC
      `);
    } else {
      result = await pool.query(`
        SELECT r.*, un.name as university_name 
        FROM registrations r 
        JOIN universities un ON r.university_id = un.id 
        WHERE r.student_id = $1 
        ORDER BY r.created_at DESC
      `, [req.user.id]);
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/registrations/student', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, un.name as university_name 
      FROM registrations r 
      JOIN universities un ON r.university_id = un.id 
      WHERE r.student_id = $1 
      ORDER BY r.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get student registrations error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/registrations', authenticateToken, async (req, res) => {
  const { universityId, visaSystem } = req.body;
  if (!universityId) return res.status(400).json({ error: 'University ID is required' });

  try {
    const result = await pool.query(
      'INSERT INTO registrations (id, student_id, university_id, visa_system) VALUES ($1, $2, $3, $4) RETURNING id',
      [uuidv4(), req.user.id, universityId, visaSystem]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Registration created successfully' });
  } catch (error) {
    console.error('Create registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/registrations/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status, visaSystem } = req.body;

  try {
    // Check authorization
    const regResult = await pool.query('SELECT * FROM registrations WHERE id = $1', [id]);
    const registration = regResult.rows[0];

    if (!registration) return res.status(404).json({ error: 'Registration not found' });
    if (req.user.role !== 'admin' && registration.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (visaSystem) {
      updates.push(`visa_system = $${paramIndex++}`);
      params.push(visaSystem);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(id);
    const result = await pool.query(
      `UPDATE registrations SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id`,
      params
    );
    
    res.json({ message: 'Registration updated successfully' });
  } catch (error) {
    console.error('Update registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ERROR HANDLING ====================

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large (max 5MB)' });
  }
  console.error('Error:', error);
  res.status(500).json({ error: error.message || 'Internal error' });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`✅ Server running: http://localhost:${PORT}/api`);
  console.log(s3Client ? '✅ Cloudflare R2 configured' : '⚠️  R2 not configured - using local storage');
  console.log(process.env.DATABASE_URL ? '✅ PostgreSQL configured' : '❌ DATABASE_URL not set');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  console.log('Database connection closed');
  process.exit(0);
});
