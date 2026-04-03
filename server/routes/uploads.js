/**
 * Upload Routes
 * Image upload handling
 * BUG-008 FIXED: Changed from memoryStorage to diskStorage to prevent crash with large files
 */

import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../logger.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync, readFileSync, unlinkSync } from 'fs';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = join(__dirname, '../../uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

// BUG-008 FIXED: Use diskStorage instead of memoryStorage
// memoryStorage keeps entire file in RAM - crashes Render (512MB) with files >10MB
// diskStorage streams to disk - safe for large files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit (increased from 5MB)
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  }
});

// Supabase client
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

/**
 * POST /api/upload
 * Upload image (Supabase primary, Imgur fallback)
 * BUG-008 FIXED: Read from disk file instead of memory buffer
 */
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file' });
  }

  // BUG-008: Read file from disk (multer.diskStorage saves to disk, not memory)
  const filePath = req.file.path;
  let fileBuffer;
  try {
    fileBuffer = readFileSync(filePath);
  } catch (e) {
    logger.error('Failed to read uploaded file', { error: e.message, path: filePath });
    return res.status(500).json({ error: 'Failed to process uploaded file' });
  }

  // Try Supabase first
  if (supabase) {
    try {
      const filename = `${uuidv4()}-${req.file.originalname}`;
      const { data, error } = await supabase.storage
        .from('university-images')
        .upload(filename, fileBuffer, { contentType: req.file.mimetype });
      
      if (!error) {
        const { data: urlData } = supabase.storage.from('university-images').getPublicUrl(filename);
        logger.info('Image uploaded to Supabase', { filename });
        // Clean up temp file
        try { unlinkSync(filePath); } catch (e) { /* ignore cleanup error */ }
        return res.json({ url: urlData.publicUrl, provider: 'supabase' });
      }
    } catch (e) {
      logger.warn('Supabase upload failed, trying Imgur', { error: e.message });
    }
  }

  // Fallback to Imgur
  try {
    const base64 = fileBuffer.toString('base64');
    const response = await axios.post(
      'https://api.imgur.com/3/image',
      { image: base64, type: 'base64' },
      { headers: { Authorization: 'Client-ID 546c25a59c58ad7' } }
    );
    
    logger.info('Image uploaded to Imgur');
    // Clean up temp file
    try { unlinkSync(filePath); } catch (e) { /* ignore cleanup error */ }
    res.json({ url: response.data.data.link, provider: 'imgur' });
  } catch (e) {
    // Clean up temp file on error too
    try { unlinkSync(filePath); } catch (cleanupErr) { /* ignore cleanup error */ }
    logger.error('Image upload failed', { error: e.message });
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
