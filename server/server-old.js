import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

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
const R2_ENDPOINT = process.env.R2_ENDPOINT; // e.g., https://<account-id>.r2.cloudflarestorage.com
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'sacma-images';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g., https://pub-<hash>.r2.dev

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

// SQLite Database Setup
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'src', 'app', 'services', 'sacma_database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS universities (
      id TEXT PRIMARY KEY,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      university_id TEXT NOT NULL,
      visa_system TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (university_id) REFERENCES universities(id)
    )
  `);
}

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

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    db.run(
      'INSERT INTO users (id, name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, email, phone, hashedPassword, role || 'student'],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: err.message });
        }
        
        const token = jwt.sign(
          { id, email, role: role || 'student' },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '24h' }
        );
        
        res.status(201).json({
          user: { id, name, email, phone, role: role || 'student' },
          token
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
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
  });
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  db.get('SELECT id, name, email, phone, role FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// ==================== IMAGE UPLOAD ROUTES ====================

// Upload image to Cloudflare R2
app.post('/api/upload', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  // If R2 is not configured, fallback to local storage
  if (!s3Client) {
    const filename = `${uuidv4()}-${req.file.originalname}`;
    const filepath = path.join(uploadsDir, filename);
    
    try {
      fs.writeFileSync(filepath, req.file.buffer);
      const localUrl = `/uploads/${filename}`;
      return res.json({ 
        url: localUrl,
        message: 'Image saved locally (R2 not configured)'
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to save image' });
    }
  }

  try {
    const filename = `${uuidv4()}-${req.file.originalname}`;
    const key = `universities/${filename}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });

    await s3Client.send(command);

    // Construct public URL
    const publicUrl = R2_PUBLIC_URL 
      ? `${R2_PUBLIC_URL}/${key}`
      : `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`;

    res.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image to R2' });
  }
});

// Delete image from R2
app.delete('/api/upload', authenticateToken, async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  // If using local storage
  if (url.startsWith('/uploads/')) {
    const filename = path.basename(url);
    const filepath = path.join(uploadsDir, filename);
    
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      return res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete local image' });
    }
  }

  if (!s3Client) {
    return res.status(500).json({ error: 'R2 not configured' });
  }

  try {
    // Extract key from URL
    const urlObj = new URL(url);
    const key = urlObj.pathname.substring(1); // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete image from R2' });
  }
});

// Serve local uploads
app.use('/uploads', express.static(uploadsDir));

// ==================== UNIVERSITY ROUTES ====================

// Get all universities
app.get('/api/universities', (req, res) => {
  db.all('SELECT * FROM universities ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const universities = rows.map(row => ({
      ...row,
      koreanData: row.korean_data ? JSON.parse(row.korean_data) : {},
      heroImage: row.hero_image,
      thumbnail: row.thumbnail
    }));
    
    res.json(universities);
  });
});

// Get university by ID
app.get('/api/universities/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM universities WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'University not found' });
    }
    
    const university = {
      ...row,
      koreanData: row.korean_data ? JSON.parse(row.korean_data) : {},
      heroImage: row.hero_image,
      thumbnail: row.thumbnail
    };
    
    res.json(university);
  });
});

// Create university
app.post('/api/universities', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const {
    name,
    koreanName,
    region,
    country,
    ranking,
    topTier,
    location,
    heroImage,
    thumbnail,
    koreanData
  } = req.body;

  const id = uuidv4();

  db.run(
    `INSERT INTO universities (id, name, korean_name, region, country, ranking, top_tier, location, hero_image, thumbnail, korean_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, koreanName, region, country, ranking, topTier, location, heroImage, thumbnail, JSON.stringify(koreanData || {})],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id, message: 'University created successfully' });
    }
  );
});

// Update university
app.put('/api/universities/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const {
    name,
    koreanName,
    region,
    country,
    ranking,
    topTier,
    location,
    heroImage,
    thumbnail,
    koreanData
  } = req.body;

  db.run(
    `UPDATE universities SET
      name = ?, korean_name = ?, region = ?, country = ?, ranking = ?,
      top_tier = ?, location = ?, hero_image = ?, thumbnail = ?, korean_data = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name, koreanName, region, country, ranking, topTier, location, heroImage, thumbnail, JSON.stringify(koreanData || {}), id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'University not found' });
      }
      res.json({ message: 'University updated successfully' });
    }
  );
});

// Delete university
app.delete('/api/universities/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;

  db.run('DELETE FROM universities WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'University not found' });
    }
    res.json({ message: 'University deleted successfully' });
  });
});

// ==================== REGISTRATION ROUTES ====================

// Get all registrations
app.get('/api/registrations', authenticateToken, (req, res) => {
  const query = req.user.role === 'admin'
    ? `SELECT r.*, u.name as student_name, un.name as university_name 
       FROM registrations r 
       JOIN users u ON r.student_id = u.id 
       JOIN universities un ON r.university_id = un.id 
       ORDER BY r.created_at DESC`
    : `SELECT r.*, un.name as university_name 
       FROM registrations r 
       JOIN universities un ON r.university_id = un.id 
       WHERE r.student_id = ? 
       ORDER BY r.created_at DESC`;

  const params = req.user.role === 'admin' ? [] : [req.user.id];

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get registrations by student
app.get('/api/registrations/student', authenticateToken, (req, res) => {
  db.all(
    `SELECT r.*, un.name as university_name 
     FROM registrations r 
     JOIN universities un ON r.university_id = un.id 
     WHERE r.student_id = ? 
     ORDER BY r.created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Create registration
app.post('/api/registrations', authenticateToken, (req, res) => {
  const { universityId, visaSystem } = req.body;

  if (!universityId) {
    return res.status(400).json({ error: 'University ID is required' });
  }

  const id = uuidv4();

  db.run(
    'INSERT INTO registrations (id, student_id, university_id, visa_system) VALUES (?, ?, ?, ?)',
    [id, req.user.id, universityId, visaSystem],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id, message: 'Registration created successfully' });
    }
  );
});

// Update registration
app.put('/api/registrations/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, visaSystem } = req.body;

  // Check if user owns this registration or is admin
  db.get('SELECT * FROM registrations WHERE id = ?', [id], (err, registration) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    if (req.user.role !== 'admin' && registration.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (visaSystem) {
      updates.push('visa_system = ?');
      params.push(visaSystem);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    db.run(
      `UPDATE registrations SET ${updates.join(', ')} WHERE id = ?`,
      params,
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Registration updated successfully' });
      }
    );
  });
});

// ==================== ERROR HANDLING ====================

// Error handler for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Max 5MB.' });
    }
  }
  next(error);
});

// General error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: error.message || 'Internal server error' });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  if (!s3Client) {
    console.log('⚠️  Cloudflare R2 not configured - images will be stored locally');
    console.log('Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY to enable R2');
  } else {
    console.log('✅ Cloudflare R2 configured');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});
