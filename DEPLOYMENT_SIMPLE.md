# 🚀 Deployment Guide - SACMA to Render + Vercel + Supabase (100% Free)

## Overview
- **Frontend**: Vercel (Free forever)
- **Backend**: Render (Free tier)
- **Database**: Supabase PostgreSQL (500MB free)
- **Images**: Supabase Storage (1GB free) + Imgur (unlimited free)

**No credit card required for any service!**

---

## Step 1: Setup Supabase (Database + Storage)

### 1.1 Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub (or email)

### 1.2 Create New Project
1. Click **"New Project"**
2. Configure:
   - **Name**: `sacma-db`
   - **Database Password**: Generate strong password (**SAVE THIS!**)
   - **Region**: Singapore (closest to Vietnam)
   - **Plan**: Free Tier
3. Click **"Create new project"**
4. Wait 2-3 minutes for setup

### 1.3 Get Database Connection URL
1. Click **"Settings"** (bottom left)
2. Click **"Database"** tab
3. Find **"Connection string"** section
4. Click **"URI"** tab
5. Copy the connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxx.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your actual password

**Save this URL!**

### 1.4 Create Storage Bucket
1. In Supabase dashboard, click **"Storage"** in left sidebar
2. Click **"New bucket"**
3. Name: `university-images`
4. Click **"Create bucket"**
5. Click on the bucket → **"Policies"** tab
6. Click **"New policy"**
7. Select **"For full access"** template
8. Name: `public-access`
9. Click **"Save policy"**

### 1.5 Get Supabase Service Key
1. Click **"Settings"** → **"API"**
2. Copy:
   - **URL**: `https://xxxx.supabase.co`
   - **anon/public key**: `eyJ...`
   - **service_role key** (scroll down): `eyJ...` (**keep this secret!**)

---

## Step 2: Prepare Backend

### 2.1 Update package.json (remove R2, add Supabase)

Edit `server/package.json`:

```json
{
  "name": "sacma-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "@supabase/supabase-js": "^2.39.0",
    "pg": "^8.11.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "uuid": "^9.0.1",
    "axios": "^1.6.0"
  }
}
```

### 2.2 Create Simple Server with Supabase

Replace `server/server.js` with this simplified version:

```javascript
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import axios from 'axios';
import FormData from 'form-data';

dotenv.config();

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Multer setup
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// JWT middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Initialize DB
async function initDB() {
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
}
initDB();

// ================= AUTH =================
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
      [uuidv4(), name, email, hash, role || 'student']
    );
    const token = jwt.sign(rows[0], process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ user: rows[0], token });
  } catch (e) {
    res.status(409).json({ error: 'Email exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (!rows[0] || !await bcrypt.compare(password, rows[0].password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const user = { id: rows[0].id, name: rows[0].name, email: rows[0].email, role: rows[0].role };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.json({ user, token });
});

app.get('/api/auth/me', auth, async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]);
  res.json(rows[0]);
});

// ================= IMAGE UPLOAD =================
// Option 1: Supabase Storage
app.post('/api/upload/supabase', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  try {
    const filename = `${uuidv4()}-${req.file.originalname}`;
    const { data, error } = await supabase.storage
      .from('university-images')
      .upload(filename, req.file.buffer, { contentType: req.file.mimetype });
    if (error) throw error;
    const { data: url } = supabase.storage.from('university-images').getPublicUrl(filename);
    res.json({ url: url.publicUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Option 2: Imgur (anonymous, no API key needed)
app.post('/api/upload/imgur', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  try {
    const form = new FormData();
    form.append('image', req.file.buffer.toString('base64'));
    const { data } = await axios.post('https://api.imgur.com/3/image', form, {
      headers: { ...form.getHeaders(), Authorization: 'Client-ID 546c25a59c58ad7' }
    });
    res.json({ url: data.data.link });
  } catch (e) {
    res.status(500).json({ error: 'Imgur upload failed' });
  }
});

// ================= UNIVERSITIES =================
app.get('/api/universities', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM universities ORDER BY created_at DESC');
  res.json(rows.map(r => ({ ...r, koreanData: r.korean_data ? JSON.parse(r.korean_data) : {} })));
});

app.get('/api/universities/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM universities WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json({ ...rows[0], koreanData: rows[0].korean_data ? JSON.parse(rows[0].korean_data) : {} });
});

app.post('/api/universities', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { name, koreanName, region, heroImage, thumbnail, koreanData } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO universities (id, name, korean_name, region, hero_image, thumbnail, korean_data) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
    [uuidv4(), name, koreanName, region, heroImage, thumbnail, JSON.stringify(koreanData || {})]
  );
  res.status(201).json({ id: rows[0].id });
});

app.put('/api/universities/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { name, koreanName, region, heroImage, thumbnail, koreanData } = req.body;
  await pool.query(
    'UPDATE universities SET name=$1, korean_name=$2, region=$3, hero_image=$4, thumbnail=$5, korean_data=$6, updated_at=NOW() WHERE id=$7',
    [name, koreanName, region, heroImage, thumbnail, JSON.stringify(koreanData || {}), req.params.id]
  );
  res.json({ message: 'Updated' });
});

app.delete('/api/universities/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  await pool.query('DELETE FROM universities WHERE id = $1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// ================= REGISTRATIONS =================
app.get('/api/registrations', auth, async (req, res) => {
  const query = req.user.role === 'admin'
    ? `SELECT r.*, u.name as student_name, un.name as university_name FROM registrations r JOIN users u ON r.student_id = u.id JOIN universities un ON r.university_id = un.id ORDER BY r.created_at DESC`
    : `SELECT r.*, un.name as university_name FROM registrations r JOIN universities un ON r.university_id = un.id WHERE r.student_id = $1 ORDER BY r.created_at DESC`;
  const { rows } = await pool.query(query, req.user.role === 'admin' ? [] : [req.user.id]);
  res.json(rows);
});

app.post('/api/registrations', auth, async (req, res) => {
  const { universityId, visaSystem } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO registrations (id, student_id, university_id, visa_system) VALUES ($1, $2, $3, $4) RETURNING id',
    [uuidv4(), req.user.id, universityId, visaSystem]
  );
  res.status(201).json({ id: rows[0].id });
});

app.listen(PORT, () => {
  console.log(`✅ Server: http://localhost:${PORT}/api`);
  console.log(process.env.DATABASE_URL ? '✅ PostgreSQL connected' : '❌ No DATABASE_URL');
  console.log(process.env.SUPABASE_URL ? '✅ Supabase Storage ready' : '⚠️ Supabase not configured');
});
```

---

## Step 3: Deploy Backend to Render

### 3.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **New Web Service**

### 3.2 Configure
- **Name**: `sacma-backend`
- **Root Directory**: `server`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free

### 3.3 Environment Variables
Add these:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=your-random-secret-key-min-32-chars
DATABASE_URL=postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

Click **Deploy**

Copy your backend URL: `https://sacma-backend.onrender.com`

---

## Step 4: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. **Framework**: Vite
4. Add environment variable:
   ```
   VITE_API_URL=https://sacma-backend.onrender.com/api
   ```
5. Click **Deploy**

---

## 📝 Quick Reference

| Service | Free Tier | What You Get |
|---------|-----------|--------------|
| **Supabase** | 500MB DB + 1GB Storage | Database + Image storage |
| **Render** | 750 hrs/month | Backend server |
| **Vercel** | Unlimited | Frontend hosting |
| **Imgur** | Unlimited (fair use) | Backup image hosting |

**Total: $0/month!**

---

## 🔄 Image Storage Options

The backend supports **2 upload endpoints**:

1. **`POST /api/upload/supabase`** - Uses Supabase Storage (1GB free)
2. **`POST /api/upload/imgur`** - Uses Imgur (unlimited, anonymous)

Frontend can choose either. Imgur doesn't require any setup!

---

## ✅ Done!

Your app is now live with:
- ✅ PostgreSQL database (persistent)
- ✅ Image storage (Supabase + Imgur)
- ✅ 100% free, no credit card required

Test at: `https://your-vercel-app.vercel.app`
