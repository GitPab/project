import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /api/exchange-rates - Get all exchange rates
router.get('/', async (req, res) => {
  try {
    // Get from database or return defaults
    const pool = req.app.locals.pool;
    if (pool) {
      try {
        const { rows } = await pool.query('SELECT * FROM exchange_rates ORDER BY code');
        if (rows.length > 0) {
          return res.json({
            success: true,
            data: rows.map(r => ({
              code: r.code,
              name: r.name,
              symbol: r.symbol,
              rate: parseFloat(r.rate),
              lastUpdated: r.last_updated || r.updated_at
            }))
          });
        }
      } catch (dbError) {
        // Database error (table may not exist) - log and return defaults
        console.log('Exchange rates DB query failed (table may not exist), returning defaults');
      }
    }
    
    // Return defaults if no DB, no data, or DB error
    const defaultRates = [
      { code: 'KRW', name: 'Hàn Quốc Won', symbol: '₩', rate: 18.9, lastUpdated: new Date().toISOString().split('T')[0] },
      { code: 'USD', name: 'Mỹ Dollar', symbol: '$', rate: 25500, lastUpdated: new Date().toISOString().split('T')[0] },
      { code: 'JPY', name: 'Nhật Yên', symbol: '¥', rate: 170, lastUpdated: new Date().toISOString().split('T')[0] },
      { code: 'CNY', name: 'Trung Quốc Yuan', symbol: '¥', rate: 3500, lastUpdated: new Date().toISOString().split('T')[0] },
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 28000, lastUpdated: new Date().toISOString().split('T')[0] },
    ];
    
    res.json({ success: true, data: defaultRates });
  } catch (error) {
    console.error('Get exchange rates error:', error);
    res.status(500).json({ success: false, error: 'Failed to get exchange rates' });
  }
});

// PUT /api/exchange-rates - Update exchange rates (admin only)
router.put('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    const { rates } = req.body;
    if (!Array.isArray(rates)) {
      return res.status(400).json({ success: false, error: 'Invalid rates data' });
    }
    
    const pool = req.app.locals.pool;
    if (!pool) {
      // Save to a JSON file if no database
      const ratesPath = path.join(__dirname, '../data/exchange-rates.json');
      
      // Ensure directory exists
      const dir = path.dirname(ratesPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(ratesPath, JSON.stringify({
        rates: rates.map(r => ({
          ...r,
          lastUpdated: new Date().toISOString()
        })),
        updatedAt: new Date().toISOString(),
        updatedBy: req.user.email
      }, null, 2));
      
      return res.json({ 
        success: true, 
        message: 'Exchange rates saved to file',
        data: rates 
      });
    }
    
    // Save to database
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const rate of rates) {
        await client.query(
          `INSERT INTO exchange_rates (code, name, symbol, rate, last_updated, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           symbol = EXCLUDED.symbol,
           rate = EXCLUDED.rate,
           last_updated = EXCLUDED.last_updated,
           updated_by = EXCLUDED.updated_by`,
          [rate.code, rate.name, rate.symbol, rate.rate, new Date().toISOString(), req.user.email]
        );
      }
      
      await client.query('COMMIT');
      
      res.json({ 
        success: true, 
        message: 'Exchange rates updated',
        data: rates 
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update exchange rates error:', error);
    res.status(500).json({ success: false, error: 'Failed to update exchange rates' });
  }
});

export default router;
