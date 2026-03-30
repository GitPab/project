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

async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
        phone TEXT, password TEXT NOT NULL, role TEXT DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
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

// University routes
app.get('/api/universities', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM universities ORDER BY created_at DESC');
  res.json(rows.map(r => ({ ...r, koreanData: r.korean_data ? JSON.parse(r.korean_data) : {} })));
});

app.get('/api/universities/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM universities WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json({ ...rows[0], koreanData: rows[0].korean_data ? JSON.parse(rows[0].korean_data) : {} });
});

app.post('/api/universities', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { name, koreanName, region, heroImage, thumbnail, koreanData } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO universities (id, name, korean_name, region, hero_image, thumbnail, korean_data) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
    [uuidv4(), name, koreanName, region, heroImage, thumbnail, JSON.stringify(koreanData || {})]
  );
  res.status(201).json({ id: rows[0].id });
});

app.put('/api/universities/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { name, koreanName, region, heroImage, thumbnail, koreanData } = req.body;
  await pool.query(
    'UPDATE universities SET name=$1, korean_name=$2, region=$3, hero_image=$4, thumbnail=$5, korean_data=$6, updated_at=NOW() WHERE id=$7',
    [name, koreanName, region, heroImage, thumbnail, JSON.stringify(koreanData || {}), req.params.id]
  );
  res.json({ message: 'Updated' });
});

app.delete('/api/universities/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  await pool.query('DELETE FROM universities WHERE id = $1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// Registration routes
app.get('/api/registrations', authenticateToken, async (req, res) => {
  const query = req.user.role === 'admin'
    ? `SELECT r.*, u.name as student_name, un.name as university_name FROM registrations r JOIN users u ON r.student_id = u.id JOIN universities un ON r.university_id = un.id ORDER BY r.created_at DESC`
    : `SELECT r.*, un.name as university_name FROM registrations r JOIN universities un ON r.university_id = un.id WHERE r.student_id = $1 ORDER BY r.created_at DESC`;
  const { rows } = await pool.query(query, req.user.role === 'admin' ? [] : [req.user.id]);
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

app.listen(PORT, () => {
  console.log(`✅ Server: http://localhost:${PORT}/api`);
  console.log(process.env.DATABASE_URL ? '✅ PostgreSQL ready' : '❌ No DATABASE_URL');
  console.log(supabase ? '✅ Supabase ready' : '⚠️ Using Imgur only');
});

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});
