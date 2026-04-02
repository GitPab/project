import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory storage for media (in production, use cloud storage like S3)
let mediaStorage = [];
const mediaDataPath = path.join(__dirname, '../data/media.json');

// Load media from file on startup
try {
  if (fs.existsSync(mediaDataPath)) {
    const data = fs.readFileSync(mediaDataPath, 'utf8');
    mediaStorage = JSON.parse(data).media || [];
  }
} catch (e) {
  console.error('Failed to load media:', e);
}

// Save media to file
function saveMediaToFile() {
  try {
    const dir = path.dirname(mediaDataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(mediaDataPath, JSON.stringify({ media: mediaStorage }, null, 2));
  } catch (e) {
    console.error('Failed to save media:', e);
  }
}

// GET /api/media - Get all media items
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    let items = [...mediaStorage];
    
    if (type && type !== 'all') {
      items = items.filter(item => item.type === type);
    }
    
    // Sort by createdAt desc
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ success: false, error: 'Failed to get media' });
  }
});

// GET /api/media/:id - Get single media item
router.get('/:id', async (req, res) => {
  try {
    const item = mediaStorage.find(m => m.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Media not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ success: false, error: 'Failed to get media' });
  }
});

// POST /api/media - Upload new media (mock - in production use multer for file upload)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, url, type, universityId, universityName, size } = req.body;
    
    if (!name || !url || !type) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const newItem = {
      id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      url,
      type,
      universityId: universityId || null,
      universityName: universityName || null,
      size: size || '0 KB',
      createdAt: new Date().toISOString(),
      uploadedBy: req.user?.email || 'unknown'
    };
    
    mediaStorage.unshift(newItem);
    saveMediaToFile();
    
    res.json({ success: true, data: newItem, message: 'Media uploaded successfully' });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload media' });
  }
});

// DELETE /api/media/:id - Delete media item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const index = mediaStorage.findIndex(m => m.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Media not found' });
    }
    
    const deletedItem = mediaStorage.splice(index, 1)[0];
    saveMediaToFile();
    
    res.json({ success: true, message: 'Media deleted', data: deletedItem });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete media' });
  }
});

// PUT /api/media/:id - Update media metadata
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const item = mediaStorage.find(m => m.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Media not found' });
    }
    
    const { name, universityId, universityName } = req.body;
    
    if (name) item.name = name;
    if (universityId !== undefined) item.universityId = universityId;
    if (universityName !== undefined) item.universityName = universityName;
    item.updatedAt = new Date().toISOString();
    
    saveMediaToFile();
    
    res.json({ success: true, data: item, message: 'Media updated' });
  } catch (error) {
    console.error('Update media error:', error);
    res.status(500).json({ success: false, error: 'Failed to update media' });
  }
});

export default router;
