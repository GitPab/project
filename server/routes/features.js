/**
 * Feature Routes - Appointments, Scholarships, Visa, Ratings, Feedback, Email Templates, Workflow, Bulk Ops
 * These were previously only in frontend SQLite, now connected to MySQL/PostgreSQL
 */

import express from 'express';
import { getPool } from '../dbAdapter.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger.js';
import { logAudit } from '../utils/audit.js';
import { requirePermission } from '../utils/rbac.js';

const router = express.Router();

// Helper to get database pool
const DB_TYPE = process.env.DB_TYPE || 'postgresql';

function toPostgresPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

async function getDb() {
  const pool = await getPool();
  if (DB_TYPE === 'mysql') return pool;

  // PG compatibility layer for mysql-style execute + ? placeholders
  return {
    execute: async (sql, params = []) => {
      let pgSql = toPostgresPlaceholders(sql);
      const isInsert = /^\s*insert/i.test(pgSql);
      if (isInsert && !/returning\s+/i.test(pgSql)) {
        pgSql += ' RETURNING id';
      }
      const result = await pool.query(pgSql, params);
      if (isInsert) {
        return [{ insertId: result.rows[0]?.id || null }];
      }
      return [result.rows];
    }
  };
}

// ============================================
// APPOINTMENTS (Lịch hẹn)
// ============================================
router.get('/appointments', requirePermission('view', 'student'), async (req, res) => {
  try {
    const db = await getDb();
    const { student_id, status, start_date, end_date } = req.query;
    
    let sql = 'SELECT * FROM appointments WHERE 1=1';
    const params = [];
    
    if (student_id) { sql += ' AND student_id = ?'; params.push(student_id); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (start_date) { sql += ' AND start_time >= ?'; params.push(start_date); }
    if (end_date) { sql += ' AND start_time <= ?'; params.push(end_date); }
    
    sql += ' ORDER BY start_time DESC';
    
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, appointments: rows });
  } catch (error) {
    logger.error('Failed to get appointments', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/appointments', requirePermission('edit', 'student'), async (req, res) => {
  try {
    const db = await getDb();
    const { student_id, admin_id, title, description, appointment_type, start_time, end_time, location, is_online, meeting_link } = req.body;
    
    const [result] = await db.execute(
      `INSERT INTO appointments (student_id, admin_id, title, description, appointment_type, start_time, end_time, location, is_online, meeting_link, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
      [student_id, admin_id, title, description, appointment_type, start_time, end_time, location, is_online, meeting_link]
    );
    
    await logAudit(req, 'CREATE', 'appointments', result.insertId, null, req.body);
    res.json({ success: true, id: result.insertId, message: 'Appointment created' });
  } catch (error) {
    logger.error('Failed to create appointment', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SCHOLARSHIPS (Học bổng)
// ============================================
router.get('/scholarships', requirePermission('view', 'university'), async (req, res) => {
  try {
    const db = await getDb();
    const { university_id, is_active } = req.query;
    
    let sql = 'SELECT * FROM scholarships WHERE 1=1';
    const params = [];
    
    if (university_id) { sql += ' AND university_id = ?'; params.push(university_id); }
    if (is_active !== undefined) { sql += ' AND is_active = ?'; params.push(is_active === 'true'); }
    
    sql += ' ORDER BY created_at DESC';
    
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, scholarships: rows });
  } catch (error) {
    logger.error('Failed to get scholarships', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/scholarships', requirePermission('edit', 'university'), async (req, res) => {
  try {
    const db = await getDb();
    const { university_id, name, name_korean, description, amount_vnd, amount_krw, eligibility_criteria, application_deadline, requirements, max_recipients } = req.body;
    
    const [result] = await db.execute(
      `INSERT INTO scholarships (university_id, name, name_korean, description, amount_vnd, amount_krw, eligibility_criteria, application_deadline, requirements, max_recipients) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [university_id, name, name_korean, description, amount_vnd, amount_krw, eligibility_criteria, application_deadline, requirements, max_recipients]
    );
    
    await logAudit(req, 'CREATE', 'scholarships', result.insertId, null, req.body);
    res.json({ success: true, id: result.insertId, message: 'Scholarship created' });
  } catch (error) {
    logger.error('Failed to create scholarship', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// VISA APPLICATIONS (Theo dõi visa)
// ============================================
router.get('/visa-applications', requirePermission('view', 'student'), async (req, res) => {
  try {
    const db = await getDb();
    const { student_id, status } = req.query;
    
    let sql = 'SELECT * FROM visa_applications WHERE 1=1';
    const params = [];
    
    if (student_id) { sql += ' AND student_id = ?'; params.push(student_id); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    
    sql += ' ORDER BY created_at DESC';
    
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, visa_applications: rows });
  } catch (error) {
    logger.error('Failed to get visa applications', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/visa-applications', requirePermission('edit', 'student'), async (req, res) => {
  try {
    const db = await getDb();
    const { student_id, registration_id, visa_type, embassy_location, appointment_date, appointment_time, notes } = req.body;
    
    const [result] = await db.execute(
      `INSERT INTO visa_applications (student_id, registration_id, visa_type, embassy_location, appointment_date, appointment_time, notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'preparing')`,
      [student_id, registration_id, visa_type, embassy_location, appointment_date, appointment_time, notes]
    );
    
    await logAudit(req, 'CREATE', 'visa_applications', result.insertId, null, req.body);
    res.json({ success: true, id: result.insertId, message: 'Visa application created' });
  } catch (error) {
    logger.error('Failed to create visa application', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// UNIVERSITY RATINGS (Đánh giá)
// ============================================
router.get('/university-ratings', requirePermission('view', 'university'), async (req, res) => {
  try {
    const db = await getDb();
    const { university_id, is_approved } = req.query;
    
    let sql = `
      SELECT ur.*, u.email AS student_email
      FROM university_ratings ur
      LEFT JOIN users u ON u.id = ur.student_id
      WHERE 1=1
    `;
    const params = [];
    
    if (university_id) { sql += ' AND university_id = ?'; params.push(university_id); }
    if (is_approved !== undefined) { sql += ' AND is_approved = ?'; params.push(is_approved === 'true'); }
    
    sql += ' ORDER BY ur.created_at DESC';
    
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, ratings: rows });
  } catch (error) {
    logger.error('Failed to get university ratings', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/university-ratings', async (req, res) => {
  try {
    const db = await getDb();
    const { university_id, registration_id, overall_rating, teaching_quality, facilities, support_services, value_for_money, review_title, review_text } = req.body;
    const student_id = req.user.id;
    
    const [result] = await db.execute(
      `INSERT INTO university_ratings (id, university_id, student_id, registration_id, overall_rating, teaching_quality, facilities, support_services, value_for_money, review_title, review_text, is_approved) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
      [uuidv4(), university_id, student_id, registration_id, overall_rating, teaching_quality, facilities, support_services, value_for_money, review_title, review_text]
    );
    
    await logAudit(req, 'CREATE', 'university_ratings', result.insertId, null, req.body);
    res.json({ success: true, id: result.insertId, message: 'Rating submitted for approval' });
  } catch (error) {
    logger.error('Failed to create university rating', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/university-ratings/:id/approve', requirePermission('edit', 'university'), async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const approved_by = req.user.id;

    const [existing] = await db.execute('SELECT id FROM university_ratings WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Rating not found' });
    }

    await db.execute(
      `UPDATE university_ratings 
       SET is_approved = TRUE, approved_by = ?, approved_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [approved_by, id]
    );

    await logAudit(req, 'APPROVE', 'university_ratings', id, null, { approved_by });
    res.json({ success: true, message: 'Rating approved' });
  } catch (error) {
    logger.error('Failed to approve university rating', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SERVICE FEEDBACK (Phản hồi dịch vụ)
// ============================================
router.get('/service-feedback', requirePermission('view', 'analytics'), async (req, res) => {
  try {
    const db = await getDb();
    const { is_resolved } = req.query;
    
    let sql = `
      SELECT sf.*, u.email AS student_email
      FROM service_feedback sf
      LEFT JOIN users u ON u.id = sf.student_id
      WHERE 1=1
    `;
    const params = [];
    
    if (is_resolved !== undefined) { sql += ' AND is_resolved = ?'; params.push(is_resolved === 'true'); }
    
    sql += ' ORDER BY sf.created_at DESC';
    
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, feedback: rows });
  } catch (error) {
    logger.error('Failed to get service feedback', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/service-feedback', async (req, res) => {
  try {
    const db = await getDb();
    const { feedback_type, rating, feedback_text } = req.body;
    let student_id = req.user?.id || null;

    // Validate input early to avoid DB errors
    if (rating !== undefined && rating !== null) {
      const numericRating = Number(rating);
      if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
      }
    }

    // If token payload doesn't include id, attempt lookup by email
    if (!student_id && req.user?.email) {
      const [userRows] = await db.execute('SELECT id FROM users WHERE email = ?', [req.user.email]);
      student_id = userRows?.[0]?.id || null;
    }

    if (!student_id) {
      return res.status(401).json({ success: false, error: 'Invalid user session' });
    }
    
    const [result] = await db.execute(
      `INSERT INTO service_feedback (id, student_id, feedback_type, rating, feedback_text, is_resolved) 
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [uuidv4(), student_id, feedback_type, rating, feedback_text]
    );
    
    res.json({ success: true, id: result.insertId, message: 'Feedback submitted' });
  } catch (error) {
    logger.error('Failed to create service feedback', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/service-feedback/:id/resolve', requirePermission('manage', 'analytics'), async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { resolution_notes } = req.body || {};
    const resolved_by = req.user.id;

    const [existing] = await db.execute('SELECT id FROM service_feedback WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Feedback not found' });
    }

    await db.execute(
      `UPDATE service_feedback 
       SET is_resolved = TRUE, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, resolution_notes = ? 
       WHERE id = ?`,
      [resolved_by, resolution_notes || null, id]
    );

    await logAudit(req, 'RESOLVE', 'service_feedback', id, null, { resolved_by, resolution_notes });
    res.json({ success: true, message: 'Feedback resolved' });
  } catch (error) {
    logger.error('Failed to resolve service feedback', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// EMAIL TEMPLATES (Mẫu email)
// ============================================
router.get('/email-templates', requirePermission('view', 'settings'), async (req, res) => {
  try {
    const db = await getDb();
    const { template_type, is_active } = req.query;
    
    let sql = 'SELECT * FROM email_templates WHERE 1=1';
    const params = [];
    
    if (template_type) { sql += ' AND template_type = ?'; params.push(template_type); }
    if (is_active !== undefined) { sql += ' AND is_active = ?'; params.push(is_active === 'true'); }
    
    sql += ' ORDER BY name ASC';
    
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, templates: rows });
  } catch (error) {
    logger.error('Failed to get email templates', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/email-templates', requirePermission('manage', 'settings'), async (req, res) => {
  try {
    const db = await getDb();
    const { name, subject, content, template_type, variables } = req.body;
    
    const [result] = await db.execute(
      `INSERT INTO email_templates (name, subject, content, template_type, variables, is_active) 
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [name, subject, content, template_type, JSON.stringify(variables)]
    );
    
    await logAudit(req, 'CREATE', 'email_templates', result.insertId, null, req.body);
    res.json({ success: true, id: result.insertId, message: 'Email template created' });
  } catch (error) {
    logger.error('Failed to create email template', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// WORKFLOW RULES (Tự động hóa)
// ============================================
router.get('/workflow-rules', requirePermission('view', 'settings'), async (req, res) => {
  try {
    const db = await getDb();
    const { is_active, trigger_type } = req.query;
    
    let sql = 'SELECT * FROM workflow_rules WHERE 1=1';
    const params = [];
    
    if (is_active !== undefined) { sql += ' AND is_active = ?'; params.push(is_active === 'true'); }
    if (trigger_type) { sql += ' AND trigger_type = ?'; params.push(trigger_type); }
    
    sql += ' ORDER BY priority DESC, created_at DESC';
    
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, rules: rows });
  } catch (error) {
    logger.error('Failed to get workflow rules', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/workflow-rules', requirePermission('manage', 'settings'), async (req, res) => {
  try {
    const db = await getDb();
    const { name, description, trigger_type, trigger_condition, action_type, action_config, priority } = req.body;
    
    const [result] = await db.execute(
      `INSERT INTO workflow_rules (name, description, trigger_type, trigger_condition, action_type, action_config, priority, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [name, description, trigger_type, trigger_condition, action_type, JSON.stringify(action_config), priority || 1]
    );
    
    await logAudit(req, 'CREATE', 'workflow_rules', result.insertId, null, req.body);
    res.json({ success: true, id: result.insertId, message: 'Workflow rule created' });
  } catch (error) {
    logger.error('Failed to create workflow rule', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// BULK OPERATIONS (Thao tác hàng loạt)
// ============================================
router.get('/bulk-operations', requirePermission('view', 'database'), async (req, res) => {
  try {
    const db = await getDb();
    const { operation_status, performed_by } = req.query;
    
    let sql = 'SELECT * FROM bulk_operations WHERE 1=1';
    const params = [];
    
    if (operation_status) { sql += ' AND operation_status = ?'; params.push(operation_status); }
    if (performed_by) { sql += ' AND performed_by = ?'; params.push(performed_by); }
    
    sql += ' ORDER BY started_at DESC LIMIT 100';
    
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, operations: rows });
  } catch (error) {
    logger.error('Failed to get bulk operations', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bulk-operations', requirePermission('manage', 'database'), async (req, res) => {
  try {
    const db = await getDb();
    const { operation_type, input_data, total_records } = req.body;
    const performed_by = req.user.id;
    
    const [result] = await db.execute(
      `INSERT INTO bulk_operations (operation_type, operation_status, input_data, total_records, performed_by, processed_records, success_records, failed_records) 
       VALUES (?, 'pending', ?, ?, ?, 0, 0, 0)`,
      [operation_type, JSON.stringify(input_data), total_records, performed_by]
    );
    
    res.json({ success: true, id: result.insertId, message: 'Bulk operation queued' });
  } catch (error) {
    logger.error('Failed to create bulk operation', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// STUDENT PROGRESS (Tiến độ 8 bước)
// ============================================
router.get('/student-progress', requirePermission('view', 'student_progress'), async (req, res) => {
  try {
    const db = await getDb();
    const { student_id, university_id } = req.query;
    
    let sql = 'SELECT * FROM student_progress WHERE 1=1';
    const params = [];
    
    if (student_id) { sql += ' AND student_id = ?'; params.push(student_id); }
    if (university_id) { sql += ' AND university_id = ?'; params.push(university_id); }
    
    sql += ' ORDER BY stage_id ASC';
    
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, progress: rows });
  } catch (error) {
    logger.error('Failed to get student progress', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/student-progress', requirePermission('manage', 'student_progress'), async (req, res) => {
  try {
    const db = await getDb();
    const { student_id, university_id, stage_id, stage_name, status, notes } = req.body;
    
    const [result] = await db.execute(
      `INSERT INTO student_progress (student_id, university_id, stage_id, stage_name, status, notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [student_id, university_id, stage_id, stage_name, status, notes]
    );
    
    res.json({ success: true, id: result.insertId, message: 'Progress stage created' });
  } catch (error) {
    logger.error('Failed to create student progress', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// STUDENT APPLICATIONS (Đăng ký đa trường)
// ============================================
router.get('/student-applications', requirePermission('view', 'application'), async (req, res) => {
  try {
    const db = await getDb();
    const { student_id, university_id, status } = req.query;
    
    let sql = 'SELECT * FROM student_applications WHERE 1=1';
    const params = [];
    
    if (student_id) { sql += ' AND student_id = ?'; params.push(student_id); }
    if (university_id) { sql += ' AND university_id = ?'; params.push(university_id); }
    if (status) { sql += ' AND application_status = ?'; params.push(status); }
    
    sql += ' ORDER BY priority DESC, created_at DESC';
    
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, applications: rows });
  } catch (error) {
    logger.error('Failed to get student applications', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/student-applications', requirePermission('manage', 'application'), async (req, res) => {
  try {
    const db = await getDb();
    const { student_id, university_id, tracking_code, priority, is_primary, notes } = req.body;
    
    const [result] = await db.execute(
      `INSERT INTO student_applications (student_id, university_id, tracking_code, priority, is_primary, notes, application_status) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [student_id, university_id, tracking_code, priority, is_primary, notes]
    );
    
    res.json({ success: true, id: result.insertId, message: 'Application created' });
  } catch (error) {
    logger.error('Failed to create student application', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SCHEDULED REMINDERS (Nhắc nhở tự động)
// ============================================
router.get('/scheduled-reminders', requirePermission('view', 'student'), async (req, res) => {
  try {
    const db = await getDb();
    const { user_id, is_sent } = req.query;
    
    let sql = 'SELECT * FROM scheduled_reminders WHERE 1=1';
    const params = [];
    
    if (user_id) { sql += ' AND user_id = ?'; params.push(user_id); }
    if (is_sent !== undefined) { sql += ' AND is_sent = ?'; params.push(is_sent === 'true'); }
    
    sql += ' ORDER BY scheduled_date ASC';
    
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, reminders: rows });
  } catch (error) {
    logger.error('Failed to get scheduled reminders', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/scheduled-reminders', requirePermission('edit', 'student'), async (req, res) => {
  try {
    const db = await getDb();
    const { user_id, title, message, reminder_type, scheduled_date, is_recurring, recurrence_pattern } = req.body;
    
    const [result] = await db.execute(
      `INSERT INTO scheduled_reminders (user_id, title, message, reminder_type, scheduled_date, is_recurring, recurrence_pattern, is_sent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)`,
      [user_id, title, message, reminder_type, scheduled_date, is_recurring, recurrence_pattern]
    );
    
    res.json({ success: true, id: result.insertId, message: 'Reminder scheduled' });
  } catch (error) {
    logger.error('Failed to create scheduled reminder', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// USER PREFERENCES (Cài đặt người dùng)
// ============================================
router.get('/user-preferences', async (req, res) => {
  try {
    const db = await getDb();
    const user_id = req.user.id;
    
    const [rows] = await db.execute(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [user_id]
    );
    
    res.json({ success: true, preferences: rows[0] || null });
  } catch (error) {
    logger.error('Failed to get user preferences', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/user-preferences', async (req, res) => {
  try {
    const db = await getDb();
    const user_id = req.user.id;
    const { language, theme, email_notifications, sms_notifications, push_notifications, timezone, date_format } = req.body;
    
    // Try to update first, then insert if not exists
    const [existing] = await db.execute('SELECT id FROM user_preferences WHERE user_id = ?', [user_id]);
    
    if (existing.length > 0) {
      await db.execute(
        `UPDATE user_preferences SET language=?, theme=?, email_notifications=?, sms_notifications=?, 
         push_notifications=?, timezone=?, date_format=? WHERE user_id=?`,
        [language, theme, email_notifications, sms_notifications, push_notifications, timezone, date_format, user_id]
      );
      res.json({ success: true, message: 'Preferences updated' });
    } else {
      const [result] = await db.execute(
        `INSERT INTO user_preferences (user_id, language, theme, email_notifications, sms_notifications, 
         push_notifications, timezone, date_format) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, language, theme, email_notifications, sms_notifications, push_notifications, timezone, date_format]
      );
      res.json({ success: true, id: result.insertId, message: 'Preferences created' });
    }
  } catch (error) {
    logger.error('Failed to save user preferences', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SAVED FILTERS (Bộ lọc đã lưu)
// ============================================
router.get('/saved-filters', async (req, res) => {
  try {
    const db = await getDb();
    const user_id = req.user.id;
    
    const [rows] = await db.execute(
      'SELECT * FROM saved_filters WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    
    res.json({ success: true, filters: rows });
  } catch (error) {
    logger.error('Failed to get saved filters', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/saved-filters', async (req, res) => {
  try {
    const db = await getDb();
    const user_id = req.user.id;
    const { filter_name, filter_type, filter_criteria, is_default } = req.body;
    
    const [result] = await db.execute(
      `INSERT INTO saved_filters (user_id, filter_name, filter_type, filter_criteria, is_default) 
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, filter_name, filter_type, JSON.stringify(filter_criteria), is_default]
    );
    
    res.json({ success: true, id: result.insertId, message: 'Filter saved' });
  } catch (error) {
    logger.error('Failed to create saved filter', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
