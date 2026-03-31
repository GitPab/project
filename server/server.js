/**
 * SACMA API Server - Organized Routes Version
 * Main server file with modular route imports
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Database adapter
import { db, getPool } from './dbAdapter.js';
import { initializeMySQLDatabase } from './mysqlAdapter.js';

// Middleware & Utilities
import { logger, requestLogger } from './logger.js';
import { connectRedis, disconnectRedis } from './cache.js';
import { ConnectionPoolMonitor } from './poolMonitor.js';
import { setupSwagger } from './swagger.js';

// Route Modules
import authRoutes from './routes/auth.js';
import universityRoutes from './routes/universities.js';
import studentRoutes from './routes/students.js';
import registrationRoutes from './routes/registrations.js';
import databaseRoutes from './routes/database.js';
import uploadRoutes from './routes/uploads.js';
import healthRoutes from './routes/health.js';
import featureRoutes from './routes/features.js';

// Load environment variables
dotenv.config();

// ============================================
// CONFIGURATION
// ============================================
process.env.PORT = process.env.PORT || '3001';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const DB_TYPE = process.env.DB_TYPE || 'postgresql';
if (DB_TYPE === 'postgresql' && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:5432/sacma';
}

// ============================================
// EXPRESS SETUP
// ============================================
const app = express();
const PORT = process.env.PORT || 3001;

// Swagger documentation
setupSwagger(app);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts, please try again later' },
});

app.use(limiter);
app.use(requestLogger);
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Apply auth middleware to routes that need it
app.use((req, res, next) => {
  const publicPaths = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/verify-setup-token',
    '/api/auth/set-password',
    '/api/health',
    '/api/test-db-connection',
    '/api/docs',
    '/api/docs.json'
  ];
  
  if (publicPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  
  authenticateToken(req, res, next);
});

// Apply stricter rate limit to auth routes
app.use('/api/auth', authLimiter);

// ============================================
// ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin/db', databaseRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', healthRoutes);
app.use('/api/features', featureRoutes);

// ============================================
// DATABASE INITIALIZATION
// ============================================
async function initializeDatabase() {
  const pool = await getPool();
  
  if (DB_TYPE === 'mysql') {
    try {
      await initializeMySQLDatabase();
      await pool.query('SELECT 1');
      logger.info('MySQL database connected');
      console.log('✅ MySQL Database ready');
    } catch (err) {
      console.error('❌ MySQL DB connection error:', err);
    }
    return;
  }
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL, 
        email TEXT UNIQUE NOT NULL,
        phone TEXT, 
        password TEXT NOT NULL, 
        role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin', 'super_admin', 'admin_manager', 'content_editor', 'finance_admin', 'viewer')),
        is_first_login BOOLEAN DEFAULT false,
        setup_token TEXT,
        setup_token_expiry TIMESTAMP,
        invited_by UUID REFERENCES users(id),
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS universities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL, korean_name TEXT, region TEXT,
        country TEXT DEFAULT 'Hàn Quốc', ranking INTEGER, top_tier TEXT,
        hero_image TEXT, thumbnail TEXT, korean_data TEXT,
        is_active BOOLEAN DEFAULT true,
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
        form_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT', 'SYNC', 'OPTIMIZE', 'BACKUP')),
        entity_type TEXT NOT NULL,
        entity_id UUID,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Payments table - Financial transactions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
        amount DECIMAL(15, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'VND',
        payment_method VARCHAR(50) NOT NULL,
        payment_type VARCHAR(50) DEFAULT 'application_fee',
        status VARCHAR(50) DEFAULT 'pending',
        transaction_id VARCHAR(255),
        payment_proof_url TEXT,
        description TEXT,
        notes TEXT,
        processed_by UUID REFERENCES users(id),
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Documents table - File uploads
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        reviewed_by UUID REFERENCES users(id),
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Notifications table - System alerts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) DEFAULT 'info',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        link VARCHAR(500),
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Programs table - Available study programs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS programs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        korean_name VARCHAR(255),
        degree_type VARCHAR(50) NOT NULL,
        language VARCHAR(20) DEFAULT 'korean',
        duration_months INTEGER,
        tuition_fee DECIMAL(15, 2),
        currency VARCHAR(3) DEFAULT 'KRW',
        description TEXT,
        requirements TEXT,
        deadline DATE,
        intake_dates JSONB,
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Student Profiles table - Extended student information
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        date_of_birth DATE,
        gender VARCHAR(20),
        nationality VARCHAR(100),
        passport_number VARCHAR(100),
        passport_expiry DATE,
        address TEXT,
        city VARCHAR(100),
        country VARCHAR(100),
        emergency_contact_name VARCHAR(200),
        emergency_contact_phone VARCHAR(50),
        emergency_contact_relation VARCHAR(50),
        education_level VARCHAR(50) NOT NULL,
        school_name VARCHAR(255),
        graduation_year INTEGER,
        gpa DECIMAL(3, 2),
        korean_level VARCHAR(20),
        english_level VARCHAR(20),
        has_korean_certificate BOOLEAN DEFAULT false,
        korean_certificate_score VARCHAR(50),
        bio TEXT,
        profile_image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Messages table - Internal messaging
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
        recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(255),
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP,
        parent_id UUID REFERENCES messages(id),
        attachments JSONB,
        is_deleted_by_sender BOOLEAN DEFAULT false,
        is_deleted_by_recipient BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Application Timeline table - Track application progress
    await pool.query(`
      CREATE TABLE IF NOT EXISTS application_timeline (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
        stage VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        completed_at TIMESTAMP,
        completed_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Appointments table - Calendar & scheduling
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        admin_id UUID REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        appointment_type VARCHAR(50) DEFAULT 'consultation',
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        location VARCHAR(255),
        is_online BOOLEAN DEFAULT false,
        meeting_link VARCHAR(500),
        status VARCHAR(50) DEFAULT 'scheduled',
        reminder_sent BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Scholarships table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scholarships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        name_korean VARCHAR(255),
        description TEXT,
        amount_vnd DECIMAL(15,2),
        amount_krw DECIMAL(15,2),
        eligibility_criteria TEXT,
        application_deadline DATE,
        requirements TEXT,
        is_active BOOLEAN DEFAULT true,
        max_recipients INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Scholarship applications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scholarship_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scholarship_id UUID REFERENCES scholarships(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'pending',
        documents JSONB,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        decision_date TIMESTAMP,
        decision_notes TEXT,
        amount_awarded_vnd DECIMAL(15,2),
        amount_awarded_krw DECIMAL(15,2)
      )
    `);
    
    // Visa applications tracking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS visa_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
        visa_type VARCHAR(50) NOT NULL,
        embassy_location VARCHAR(255),
        submission_date TIMESTAMP,
        appointment_date TIMESTAMP,
        appointment_time VARCHAR(20),
        status VARCHAR(50) DEFAULT 'preparing',
        visa_number VARCHAR(100),
        issue_date DATE,
        expiry_date DATE,
        documents_submitted JSONB,
        interview_required BOOLEAN DEFAULT false,
        interview_date TIMESTAMP,
        interview_notes TEXT,
        rejection_reason TEXT,
        tracking_number VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // University ratings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS university_ratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        registration_id UUID REFERENCES registrations(id),
        overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
        teaching_quality INTEGER CHECK (teaching_quality BETWEEN 1 AND 5),
        facilities INTEGER CHECK (facilities BETWEEN 1 AND 5),
        support_services INTEGER CHECK (support_services BETWEEN 1 AND 5),
        value_for_money INTEGER CHECK (value_for_money BETWEEN 1 AND 5),
        review_title VARCHAR(255),
        review_text TEXT,
        is_approved BOOLEAN DEFAULT false,
        approved_by UUID REFERENCES users(id),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Service feedback table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        feedback_type VARCHAR(50) DEFAULT 'general',
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        feedback_text TEXT,
        is_resolved BOOLEAN DEFAULT false,
        resolved_by UUID REFERENCES users(id),
        resolved_at TIMESTAMP,
        resolution_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Email templates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        subject VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        template_type VARCHAR(50) DEFAULT 'general',
        variables JSONB,
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Workflow automation rules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workflow_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        trigger_type VARCHAR(50) NOT NULL,
        trigger_condition TEXT NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        action_config JSONB,
        is_active BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 1,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Bulk operations log table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bulk_operations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        operation_type VARCHAR(50) NOT NULL,
        operation_status VARCHAR(50) DEFAULT 'pending',
        total_records INTEGER,
        processed_records INTEGER DEFAULT 0,
        success_records INTEGER DEFAULT 0,
        failed_records INTEGER DEFAULT 0,
        input_data JSONB,
        result_data JSONB,
        error_log TEXT,
        performed_by UUID REFERENCES users(id),
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);
    
    // Communication logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS communication_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_email VARCHAR(255),
        recipient_phone VARCHAR(50),
        communication_type VARCHAR(50) NOT NULL,
        subject VARCHAR(255),
        content TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        opened_at TIMESTAMP,
        error_message TEXT,
        template_used VARCHAR(255) REFERENCES email_templates(name),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Student Progress table - 8 stage pipeline
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
        stage_id INTEGER NOT NULL,
        stage_name VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        start_date TIMESTAMP,
        completed_date TIMESTAMP,
        notes TEXT,
        updated_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Student Applications table (multi-university)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
        tracking_code VARCHAR(50),
        application_status VARCHAR(50) DEFAULT 'pending',
        priority INTEGER DEFAULT 1,
        is_primary BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Scheduled Reminders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scheduled_reminders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        recipient_role VARCHAR(50) DEFAULT 'student',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        reminder_type VARCHAR(50) DEFAULT 'payment',
        related_entity_type VARCHAR(100),
        related_entity_id UUID,
        scheduled_date TIMESTAMP NOT NULL,
        is_recurring BOOLEAN DEFAULT false,
        recurrence_pattern VARCHAR(100),
        is_sent BOOLEAN DEFAULT false,
        sent_at TIMESTAMP,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Analytics Metrics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        metric_name VARCHAR(100) NOT NULL,
        metric_category VARCHAR(100),
        metric_value DECIMAL(15,4),
        metric_data JSONB,
        dimension1 VARCHAR(100),
        dimension2 VARCHAR(100),
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // User Preferences table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        language VARCHAR(10) DEFAULT 'vi',
        theme VARCHAR(20) DEFAULT 'light',
        email_notifications BOOLEAN DEFAULT true,
        sms_notifications BOOLEAN DEFAULT false,
        push_notifications BOOLEAN DEFAULT true,
        timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
        date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
        preferences_data JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Two-Factor Authentication table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_2fa (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        secret VARCHAR(255) NOT NULL,
        backup_codes JSONB,
        is_enabled BOOLEAN DEFAULT false,
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // User Sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        device_info VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Saved Filters table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_filters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        filter_name VARCHAR(255) NOT NULL,
        filter_type VARCHAR(100) NOT NULL,
        filter_criteria JSONB NOT NULL,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_universities_name ON universities(name)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_registrations_student ON registrations(student_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)`);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at)`);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_documents_student ON documents(student_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)`);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at)`);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_programs_university ON programs(university_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_programs_degree ON programs(degree_type)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_programs_is_active ON programs(is_active)`);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_student_profiles_user ON student_profiles(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_student_profiles_nationality ON student_profiles(nationality)`);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read)`);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_application_timeline_registration ON application_timeline(registration_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_application_timeline_stage ON application_timeline(stage)`);
    
    // Indexes for new feature tables
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_appointments_student ON appointments(student_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)`);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_scholarships_university ON scholarships(university_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_scholarships_active ON scholarships(is_active)`);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_scholarship_apps_student ON scholarship_applications(student_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_scholarship_apps_scholarship ON scholarship_applications(scholarship_id)`);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_visa_apps_student ON visa_applications(student_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_visa_apps_status ON visa_applications(status)`);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_university_ratings_university ON university_ratings(university_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_university_ratings_student ON university_ratings(student_id)`);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_service_feedback_student ON service_feedback(student_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_service_feedback_resolved ON service_feedback(is_resolved)`);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(template_type)`);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_workflow_rules_active ON workflow_rules(is_active)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_workflow_rules_trigger ON workflow_rules(trigger_type)`);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_bulk_operations_status ON bulk_operations(operation_status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_bulk_operations_type ON bulk_operations(operation_type)`);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_comm_logs_recipient ON communication_logs(recipient_email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_comm_logs_status ON communication_logs(status)`);
    
    // Indexes for additional tables
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_student_progress_student ON student_progress(student_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_student_applications_student ON student_applications(student_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_user ON scheduled_reminders(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_saved_filters_user ON saved_filters(user_id)`);
    
    console.log('✅ PostgreSQL Database ready');
  } catch (err) {
    console.error('❌ DB init error:', err);
  }
}

import autoSyncManager from './autoSync.js';

// ============================================
// SERVER STARTUP
// ============================================
let pool;
let poolMonitor = null;

async function startServer() {
  pool = await getPool();
  
  if (DB_TYPE === 'postgresql') {
    poolMonitor = new ConnectionPoolMonitor(pool);
    poolMonitor.startMonitoring(30000);
  }
  
  await initializeDatabase();
  await connectRedis();
  
  app.listen(PORT, () => {
    logger.info('Server started', { 
      port: PORT, 
      url: `http://localhost:${PORT}/api`,
      database: { type: DB_TYPE, status: 'connected' },
      swagger: `http://localhost:${PORT}/api/docs`
    });
    console.log(`\n🚀 Server running at http://localhost:${PORT}/api`);
    console.log(`📚 API Docs at http://localhost:${PORT}/api/docs\n`);
    
    // Start automatic sync if enabled
    autoSyncManager.start();
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
process.on('SIGINT', async () => {
  logger.info('Shutting down server gracefully');
  if (poolMonitor) poolMonitor.stopMonitoring();
  await disconnectRedis();
  await db.end();
  logger.info('Server shutdown complete');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down server gracefully (SIGTERM)');
  if (poolMonitor) poolMonitor.stopMonitoring();
  await disconnectRedis();
  await db.end();
  logger.info('Server shutdown complete');
  process.exit(0);
});
