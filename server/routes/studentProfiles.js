/**
 * Student Profiles API Routes
 * Extended student information
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../dbAdapter.js';
import { logger } from '../logger.js';
import { hasPermission } from '../utils/rbac.js';

const router = express.Router();

/**
 * GET /api/student-profiles
 * Get current student's profile
 */
router.get('/', async (req, res) => {
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      `SELECT sp.*, u.name, u.email, u.phone 
       FROM student_profiles sp 
       JOIN users u ON sp.user_id = u.id 
       WHERE sp.user_id = $1`,
      [req.user.id]
    );
    
    if (!rows[0]) {
      // Return empty profile if not exists
      return res.json({ user_id: req.user.id, is_empty: true });
    }
    
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to fetch student profile', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch student profile' });
  }
});

/**
 * GET /api/student-profiles/:userId
 * Get specific student's profile (admin only)
 */
router.get('/:userId', async (req, res) => {
  const hasFullAccess = hasPermission(req.user.role, 'manage', 'student');
  
  if (!hasFullAccess && req.params.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      `SELECT sp.*, u.name, u.email, u.phone 
       FROM student_profiles sp 
       JOIN users u ON sp.user_id = u.id 
       WHERE sp.user_id = $1`,
      [req.params.userId]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to fetch student profile', { error: error.message, userId: req.params.userId });
    res.status(500).json({ error: 'Failed to fetch student profile' });
  }
});

/**
 * POST /api/student-profiles
 * Create or update student profile
 */
router.post('/', async (req, res) => {
  const pool = await getPool();
  const userId = req.user.id;
  
  const {
    date_of_birth,
    gender,
    nationality,
    passport_number,
    passport_expiry,
    address,
    city,
    country,
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_relation,
    education_level,
    school_name,
    graduation_year,
    gpa,
    korean_level,
    english_level,
    has_korean_certificate,
    korean_certificate_score,
    bio,
    profile_image_url
  } = req.body;
  
  try {
    // Check if profile exists
    const { rows: existing } = await pool.query(
      'SELECT id FROM student_profiles WHERE user_id = $1',
      [userId]
    );
    
    let result;
    
    if (existing[0]) {
      // Update existing
      const { rows } = await pool.query(
        `UPDATE student_profiles SET
          date_of_birth = $1, gender = $2, nationality = $3, passport_number = $4,
          passport_expiry = $5, address = $6, city = $7, country = $8,
          emergency_contact_name = $9, emergency_contact_phone = $10, emergency_contact_relation = $11,
          education_level = $12, school_name = $13, graduation_year = $14, gpa = $15,
          korean_level = $16, english_level = $17, has_korean_certificate = $18,
          korean_certificate_score = $19, bio = $20, profile_image_url = $21,
          updated_at = NOW()
         WHERE user_id = $22 RETURNING *`,
        [
          date_of_birth || null, gender || null, nationality || null, passport_number || null,
          passport_expiry || null, address || null, city || null, country || null,
          emergency_contact_name || null, emergency_contact_phone || null, emergency_contact_relation || null,
          education_level || null, school_name || null, graduation_year || null, gpa || null,
          korean_level || null, english_level || null, has_korean_certificate || false,
          korean_certificate_score || null, bio || null, profile_image_url || null,
          userId
        ]
      );
      result = rows[0];
      logger.info('Student profile updated', { userId });
    } else {
      // Create new
      const { rows } = await pool.query(
        `INSERT INTO student_profiles (
          id, user_id, date_of_birth, gender, nationality, passport_number, passport_expiry,
          address, city, country, emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
          education_level, school_name, graduation_year, gpa,
          korean_level, english_level, has_korean_certificate, korean_certificate_score,
          bio, profile_image_url, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NOW())
        RETURNING *`,
        [
          uuidv4(), userId, date_of_birth || null, gender || null, nationality || null, passport_number || null,
          passport_expiry || null, address || null, city || null, country || null,
          emergency_contact_name || null, emergency_contact_phone || null, emergency_contact_relation || null,
          education_level || null, school_name || null, graduation_year || null, gpa || null,
          korean_level || null, english_level || null, has_korean_certificate || false,
          korean_certificate_score || null, bio || null, profile_image_url || null
        ]
      );
      result = rows[0];
      logger.info('Student profile created', { userId, profileId: result.id });
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Failed to save student profile', { error: error.message, userId });
    res.status(500).json({ error: 'Failed to save student profile' });
  }
});

/**
 * PUT /api/student-profiles/:userId
 * Admin update student profile
 */
router.put('/:userId', async (req, res) => {
  const hasFullAccess = hasPermission(req.user.role, 'manage', 'student');
  
  if (!hasFullAccess && req.params.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const pool = await getPool();
  const userId = req.params.userId;
  const updateFields = req.body;
  
  try {
    const allowedFields = [
      'date_of_birth', 'gender', 'nationality', 'passport_number', 'passport_expiry',
      'address', 'city', 'country', 'emergency_contact_name', 'emergency_contact_phone',
      'emergency_contact_relation', 'education_level', 'school_name', 'graduation_year',
      'gpa', 'korean_level', 'english_level', 'has_korean_certificate',
      'korean_certificate_score', 'bio', 'profile_image_url'
    ];
    
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updateFields)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramIndex++}`);
        params.push(value);
      }
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updates.push(`updated_at = NOW()`);
    params.push(userId);
    
    const { rows } = await pool.query(
      `UPDATE student_profiles SET ${updates.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
      params
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    
    logger.info('Student profile updated by admin', { userId, adminId: req.user.id });
    res.json(rows[0]);
  } catch (error) {
    logger.error('Failed to update student profile', { error: error.message, userId });
    res.status(500).json({ error: 'Failed to update student profile' });
  }
});

/**
 * DELETE /api/student-profiles/:userId
 * Delete student profile (admin only)
 */
router.delete('/:userId', async (req, res) => {
  const hasFullAccess = hasPermission(req.user.role, 'manage', 'student');
  
  if (!hasFullAccess) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const pool = await getPool();
  
  try {
    const { rows } = await pool.query(
      'DELETE FROM student_profiles WHERE user_id = $1 RETURNING id',
      [req.params.userId]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    
    logger.info('Student profile deleted', { userId: req.params.userId, adminId: req.user.id });
    res.json({ message: 'Student profile deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete student profile', { error: error.message, userId: req.params.userId });
    res.status(500).json({ error: 'Failed to delete student profile' });
  }
});

export default router;
