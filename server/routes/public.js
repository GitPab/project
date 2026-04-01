/**
 * Public API Routes
 * No authentication required - for guest users
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../dbAdapter.js';
import { logger } from '../logger.js';

const router = express.Router();

/**
 * POST /api/public/quick-search
 * Save quick search data and generate tracking code
 */
router.post('/quick-search', async (req, res) => {
  const { fullName, phone, gpa, topik, visaSystem } = req.body;
  
  if (!fullName || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }
  
  const pool = await getPool();
  
  try {
    // Generate tracking code
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    const trackingCode = `SAC${year}${random}`;
    
    // Create student user (simplified, no password needed)
    const studentId = uuidv4();
    const tempPassword = Math.random().toString(36).slice(-8);
    
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Insert student user
    await pool.query(
      `INSERT INTO users (id, name, email, phone, password, role, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [studentId, fullName, `${phone}@temp.sacma`, phone, hashedPassword, 'student', true]
    );
    
    // Create student profile with GPA and TOPIK
    await pool.query(
      `INSERT INTO student_profiles (id, user_id, gpa, korean_level, created_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [uuidv4(), studentId, gpa || 0, topik > 0 ? `TOPIK ${topik}` : 'None']
    );
    
    logger.info('Quick search saved', { studentId, trackingCode, phone });
    
    res.status(201).json({
      trackingCode,
      studentId,
      message: 'Đăng ký thành công! Mã tra cứu của bạn: ' + trackingCode
    });
  } catch (error) {
    logger.error('Failed to save quick search', { error: error.message });
    res.status(500).json({ error: 'Failed to save search data' });
  }
});

/**
 * GET /api/public/tracking/:code
 * Public tracking lookup - no auth required
 */
router.get('/tracking/:code', async (req, res) => {
  const { code } = req.params;
  
  if (!code) {
    return res.status(400).json({ error: 'Tracking code is required' });
  }
  
  const pool = await getPool();
  
  try {
    // Find student by tracking code (stored in student_applications table)
    const { rows } = await pool.query(
      `SELECT sa.*, u.name, u.phone, un.name as university_name, 
              sp.gpa, sp.korean_level
       FROM student_applications sa
       JOIN users u ON sa.student_id = u.id
       LEFT JOIN universities un ON sa.university_id = un.id
       LEFT JOIN student_profiles sp ON sp.user_id = sa.student_id
       WHERE sa.tracking_code = $1`,
      [code]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Không tìm thấy mã tra cứu' });
    }
    
    // Get timeline data
    const { rows: timelineRows } = await pool.query(
      `SELECT stage, status, notes, completed_at, created_at
       FROM application_timeline
       WHERE registration_id = $1
       ORDER BY created_at ASC`,
      [rows[0].id]
    );
    
    const response = {
      code: rows[0].tracking_code,
      name: rows[0].name,
      phone: rows[0].phone,
      university: rows[0].university_name || 'Chưa chọn trường',
      visaSystem: rows[0].visa_system || 'Chưa chọn',
      topikLevel: rows[0].korean_level || 'Chưa có',
      gpa: rows[0].gpa || 0,
      status: rows[0].application_status || 'pending',
      createdAt: rows[0].created_at,
      timeline: timelineRows.length > 0 ? timelineRows : [
        { step: 'Đăng ký tư vấn', status: 'completed', date: rows[0].created_at },
        { step: 'Xét duyệt hồ sơ', status: 'in_progress', date: null },
        { step: 'Tư vấn chi tiết', status: 'pending', date: null }
      ]
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to lookup tracking code', { error: error.message, code });
    res.status(500).json({ error: 'Failed to lookup tracking code' });
  }
});

/**
 * POST /api/public/consultation
 * Submit consultation form (after quick search results)
 */
router.post('/consultation', async (req, res) => {
  const { 
    fullName, phone, email, 
    universityId, visaSystem, topikLevel,
    preferredTime, notes 
  } = req.body;
  
  if (!fullName || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }
  
  const pool = await getPool();
  
  try {
    // Check if student already exists by phone
    const { rows: existingUsers } = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      [phone]
    );
    
    let studentId;
    const bcrypt = await import('bcryptjs');
    
    if (existingUsers.length > 0) {
      studentId = existingUsers[0].id;
    } else {
      // Create new student
      studentId = uuidv4();
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      await pool.query(
        `INSERT INTO users (id, name, email, phone, password, role, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [studentId, fullName, email || `${phone}@temp.sacma`, phone, hashedPassword, 'student', true]
      );
      
      // Create student profile
      await pool.query(
        `INSERT INTO student_profiles (id, user_id, korean_level, created_at) 
         VALUES ($1, $2, $3, NOW())`,
        [uuidv4(), studentId, topikLevel > 0 ? `TOPIK ${topikLevel}` : 'None']
      );
    }
    
    // Create registration if university selected
    let registrationId = null;
    if (universityId) {
      const date = new Date();
      const year = date.getFullYear();
      const random = Math.floor(1000 + Math.random() * 9000);
      const trackingCode = `SAC${year}${random}`;
      
      const { rows } = await pool.query(
        `INSERT INTO registrations (id, student_id, university_id, visa_system, form_data, created_at) 
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`,
        [uuidv4(), studentId, universityId, visaSystem, JSON.stringify({ preferredTime, notes, topikLevel })]
      );
      registrationId = rows[0].id;
      
      // Create student application with tracking code
      await pool.query(
        `INSERT INTO student_applications (id, student_id, university_id, tracking_code, application_status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [uuidv4(), studentId, universityId, trackingCode, 'pending']
      );
      
      // Create timeline entries
      await pool.query(
        `INSERT INTO application_timeline (id, registration_id, stage, status, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [uuidv4(), registrationId, 'Đăng ký tư vấn', 'completed']
      );
      
      logger.info('Consultation submitted', { studentId, registrationId, trackingCode });
      
      res.status(201).json({
        success: true,
        trackingCode,
        registrationId,
        message: 'Đăng ký tư vấn thành công! Mã tra cứu: ' + trackingCode
      });
    } else {
      logger.info('Consultation submitted (no university)', { studentId });
      res.status(201).json({
        success: true,
        message: 'Đăng ký tư vấn thành công! Chúng tôi sẽ liên hệ bạn sớm.'
      });
    }
  } catch (error) {
    logger.error('Failed to submit consultation', { error: error.message });
    res.status(500).json({ error: 'Failed to submit consultation' });
  }
});

/**
 * GET /api/public/universities
 * List all active universities (public)
 */
router.get('/universities', async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      `SELECT id, name, korean_name, region, country, ranking, top_tier, 
              hero_image, thumbnail, korean_data, is_active
       FROM universities 
       WHERE is_active = true 
       ORDER BY ranking ASC NULLS LAST, name ASC`
    );
    
    res.json(rows);
  } catch (error) {
    logger.error('Failed to fetch universities', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch universities' });
  }
});

/**
 * GET /api/public/universities/:id
 * Get university details (public)
 */
router.get('/universities/:id', async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      `SELECT id, name, korean_name, region, country, ranking, top_tier, 
              hero_image, thumbnail, korean_data, is_active
       FROM universities 
       WHERE id = $1 AND is_active = true`,
      [req.params.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'University not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to fetch university', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to fetch university' });
  }
});

export default router;
