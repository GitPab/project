/**
 * Upload Routes
 * Image upload handling
 */

import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../logger.js';

const router = express.Router();

// Multer configuration
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
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
 */
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file' });
  }

  // Try Supabase first
  if (supabase) {
    try {
      const filename = `${uuidv4()}-${req.file.originalname}`;
      const { data, error } = await supabase.storage
        .from('university-images')
        .upload(filename, req.file.buffer, { contentType: req.file.mimetype });
      
      if (!error) {
        const { data: urlData } = supabase.storage.from('university-images').getPublicUrl(filename);
        logger.info('Image uploaded to Supabase', { filename });
        return res.json({ url: urlData.publicUrl, provider: 'supabase' });
      }
    } catch (e) {
      logger.warn('Supabase upload failed, trying Imgur', { error: e.message });
    }
  }

  // Fallback to Imgur
  try {
    const base64 = req.file.buffer.toString('base64');
    const response = await axios.post(
      'https://api.imgur.com/3/image',
      { image: base64, type: 'base64' },
      { headers: { Authorization: 'Client-ID 546c25a59c58ad7' } }
    );
    
    logger.info('Image uploaded to Imgur');
    res.json({ url: response.data.data.link, provider: 'imgur' });
  } catch (e) {
    logger.error('Image upload failed', { error: e.message });
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
