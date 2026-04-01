import mysql from 'mysql2/promise';
import { logger } from './logger.js';

// MySQL connection pool
let mysqlPool = null;

// Create database connection (without database first)
export async function createMySQLConnection() {
  return mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
  });
}

// Ensure database exists
export async function ensureDatabaseExists() {
  const connection = await createMySQLConnection();
  const databaseName = process.env.MYSQL_DATABASE || 'sacma';
  
  try {
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
    logger.info(`Database '${databaseName}' ensured`);
  } catch (error) {
    logger.error('Failed to create database', { error: error.message });
    throw error;
  } finally {
    await connection.end();
  }
}

export async function createMySQLPool() {
  if (!mysqlPool) {
    // First ensure database exists
    await ensureDatabaseExists();
    
    mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'sacma',
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
    
    logger.info('MySQL pool created', { 
      host: process.env.MYSQL_HOST || 'localhost',
      database: process.env.MYSQL_DATABASE || 'sacma'
    });
  }
  return mysqlPool;
}

// Convert PostgreSQL query to MySQL syntax
export function convertQuery(pgQuery) {
  let mysqlQuery = pgQuery
    // Replace $1, $2, etc with ?
    .replace(/\$(\d+)/g, '?')
    // Replace ILIKE with LIKE (case-insensitive in MySQL by default)
    .replace(/ILIKE/g, 'LIKE')
    // Replace gen_random_uuid() with UUID()
    .replace(/gen_random_uuid\(\)/g, 'UUID()')
    // Replace ::type casts
    .replace(/::[a-zA-Z_]+/g, '')
    // Replace JSONB with JSON
    .replace(/JSONB/g, 'JSON')
    // Replace INET with VARCHAR(45)
    .replace(/INET/g, 'VARCHAR(45)');
  
  return mysqlQuery;
}

// Convert PostgreSQL parameters to MySQL format
export function convertParams(params) {
  if (!params || params.length === 0) return [];
  
  return params.map(param => {
    // Convert JSON objects to strings
    if (typeof param === 'object' && param !== null) {
      return JSON.stringify(param);
    }
    return param;
  });
}

// MySQL query wrapper that mimics pg interface
export async function mysqlQuery(query, params = []) {
  const pool = createMySQLPool();
  const convertedQuery = convertQuery(query);
  const convertedParams = convertParams(params);
  
  try {
    const [rows] = await pool.execute(convertedQuery, convertedParams);
    return { rows };
  } catch (error) {
    logger.error('MySQL query error', { error: error.message, query: convertedQuery });
    throw error;
  }
}

// Initialize MySQL database tables
export async function initializeMySQLDatabase() {
  const pool = await createMySQLPool();
  
  try {
    // Users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(200) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'admin', 'super_admin', 'admin_manager', 'content_editor', 'finance_admin', 'viewer') DEFAULT 'student',
        is_first_login BOOLEAN DEFAULT FALSE,
        setup_token VARCHAR(128),
        setup_token_expiry TIMESTAMP NULL,
        invited_by VARCHAR(36),
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (invited_by) REFERENCES users(id)
      )
    `);
    
    // Universities table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS universities (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(200) NOT NULL,
        korean_name VARCHAR(200),
        country VARCHAR(100) DEFAULT 'Hàn Quốc',
        region VARCHAR(100),
        ranking VARCHAR(50),
        top_tier VARCHAR(10),
        hero_image TEXT,
        thumbnail TEXT,
        korean_data JSON,
        cache_version INT DEFAULT 0,
        updated_by VARCHAR(36),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users(id)
      )
    `);
    
    // Registrations table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS registrations (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        student_id VARCHAR(36) NOT NULL,
        university_id VARCHAR(36) NOT NULL,
        visa_system VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        form_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
      )
    `);
    
    // Audit logs table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36),
        action ENUM('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT', 'SYNC', 'OPTIMIZE', 'BACKUP') NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(36),
        old_values JSON,
        new_values JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    // Payments table - Financial transactions
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        student_id VARCHAR(36) NOT NULL,
        registration_id VARCHAR(36),
        amount DECIMAL(15, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'VND',
        payment_method ENUM('bank_transfer', 'credit_card', 'cash', 'paypal', 'stripe') NOT NULL,
        payment_type ENUM('application_fee', 'tuition', 'deposit', 'other') DEFAULT 'application_fee',
        status ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled') DEFAULT 'pending',
        transaction_id VARCHAR(255),
        payment_proof_url TEXT,
        description TEXT,
        notes TEXT,
        processed_by VARCHAR(36),
        paid_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE SET NULL,
        FOREIGN KEY (processed_by) REFERENCES users(id)
      )
    `);
    
    // Documents table - File uploads
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        student_id VARCHAR(36) NOT NULL,
        document_type ENUM('passport', 'transcript', 'diploma', 'photo', 'recommendation', 'essay', 'financial_proof', 'other') NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_size INT,
        mime_type VARCHAR(100),
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        notes TEXT,
        reviewed_by VARCHAR(36),
        reviewed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
      )
    `);
    
    // Notifications table - System alerts
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        link VARCHAR(500),
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Programs table - Available study programs
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS programs (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        university_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        korean_name VARCHAR(255),
        degree_type ENUM('bachelor', 'master', 'phd', 'language', 'short_term') NOT NULL,
        language ENUM('korean', 'english', 'mixed') DEFAULT 'korean',
        duration_months INT,
        tuition_fee DECIMAL(15, 2),
        currency VARCHAR(3) DEFAULT 'KRW',
        description TEXT,
        requirements TEXT,
        deadline DATE,
        intake_dates JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    
    // Student Profiles table - Extended student information
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS student_profiles (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL UNIQUE,
        date_of_birth DATE,
        gender ENUM('male', 'female', 'other'),
        nationality VARCHAR(100),
        passport_number VARCHAR(100),
        passport_expiry DATE,
        address TEXT,
        city VARCHAR(100),
        country VARCHAR(100),
        emergency_contact_name VARCHAR(200),
        emergency_contact_phone VARCHAR(50),
        emergency_contact_relation VARCHAR(50),
        education_level ENUM('high_school', 'bachelor', 'master', 'phd') NOT NULL,
        school_name VARCHAR(255),
        graduation_year INT,
        gpa DECIMAL(3, 2),
        korean_level ENUM('none', 'beginner', 'intermediate', 'advanced', 'native'),
        english_level ENUM('none', 'beginner', 'intermediate', 'advanced', 'native'),
        has_korean_certificate BOOLEAN DEFAULT FALSE,
        korean_certificate_score VARCHAR(50),
        bio TEXT,
        profile_image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Messages table - Internal messaging
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        sender_id VARCHAR(36) NOT NULL,
        recipient_id VARCHAR(36) NOT NULL,
        subject VARCHAR(255),
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP NULL,
        parent_id VARCHAR(36),
        attachments JSON,
        is_deleted_by_sender BOOLEAN DEFAULT FALSE,
        is_deleted_by_recipient BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES messages(id)
      )
    `);
    
    // Application Timeline table - Track application progress
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS application_timeline (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        registration_id VARCHAR(36) NOT NULL,
        stage ENUM('submitted', 'document_review', 'interview', 'university_review', 'accepted', 'rejected', 'enrolled') NOT NULL,
        status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
        notes TEXT,
        completed_at TIMESTAMP NULL,
        completed_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
        FOREIGN KEY (completed_by) REFERENCES users(id)
      )
    `);
    
    // Appointments table - Calendar & scheduling
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS appointments (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        student_id VARCHAR(36) NOT NULL,
        admin_id VARCHAR(36),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        appointment_type VARCHAR(50) DEFAULT 'consultation',
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        location VARCHAR(255),
        is_online BOOLEAN DEFAULT FALSE,
        meeting_link VARCHAR(500),
        status VARCHAR(50) DEFAULT 'scheduled',
        reminder_sent BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (admin_id) REFERENCES users(id)
      )
    `);
    
    // Scholarships table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS scholarships (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        university_id VARCHAR(36),
        name VARCHAR(255) NOT NULL,
        name_korean VARCHAR(255),
        description TEXT,
        amount_vnd DECIMAL(15,2),
        amount_krw DECIMAL(15,2),
        eligibility_criteria TEXT,
        application_deadline DATE,
        requirements TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        max_recipients INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE SET NULL
      )
    `);
    
    // Scholarship applications table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS scholarship_applications (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        scholarship_id VARCHAR(36) NOT NULL,
        student_id VARCHAR(36) NOT NULL,
        registration_id VARCHAR(36),
        status VARCHAR(50) DEFAULT 'pending',
        documents JSON,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        decision_date TIMESTAMP,
        decision_notes TEXT,
        amount_awarded_vnd DECIMAL(15,2),
        amount_awarded_krw DECIMAL(15,2),
        FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE SET NULL
      )
    `);
    
    // Visa applications tracking table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS visa_applications (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        student_id VARCHAR(36) NOT NULL,
        registration_id VARCHAR(36),
        visa_type VARCHAR(50) NOT NULL,
        embassy_location VARCHAR(255),
        submission_date TIMESTAMP,
        appointment_date TIMESTAMP,
        appointment_time VARCHAR(20),
        status VARCHAR(50) DEFAULT 'preparing',
        visa_number VARCHAR(100),
        issue_date DATE,
        expiry_date DATE,
        documents_submitted JSON,
        interview_required BOOLEAN DEFAULT FALSE,
        interview_date TIMESTAMP,
        interview_notes TEXT,
        rejection_reason TEXT,
        tracking_number VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE SET NULL
      )
    `);
    
    // University ratings table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS university_ratings (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        university_id VARCHAR(36) NOT NULL,
        student_id VARCHAR(36) NOT NULL,
        registration_id VARCHAR(36),
        overall_rating INT CHECK (overall_rating BETWEEN 1 AND 5),
        teaching_quality INT CHECK (teaching_quality BETWEEN 1 AND 5),
        facilities INT CHECK (facilities BETWEEN 1 AND 5),
        support_services INT CHECK (support_services BETWEEN 1 AND 5),
        value_for_money INT CHECK (value_for_money BETWEEN 1 AND 5),
        review_title VARCHAR(255),
        review_text TEXT,
        is_approved BOOLEAN DEFAULT FALSE,
        approved_by VARCHAR(36),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users(id)
      )
    `);
    
    // Service feedback table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS service_feedback (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        student_id VARCHAR(36) NOT NULL,
        feedback_type VARCHAR(50) DEFAULT 'general',
        rating INT CHECK (rating BETWEEN 1 AND 5),
        feedback_text TEXT,
        is_resolved BOOLEAN DEFAULT FALSE,
        resolved_by VARCHAR(36),
        resolved_at TIMESTAMP,
        resolution_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (resolved_by) REFERENCES users(id)
      )
    `);
    
    // Email templates table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL UNIQUE,
        subject VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        template_type VARCHAR(50) DEFAULT 'general',
        variables JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    
    // Workflow automation rules table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS workflow_rules (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        trigger_type VARCHAR(50) NOT NULL,
        trigger_condition TEXT NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        action_config JSON,
        is_active BOOLEAN DEFAULT TRUE,
        priority INT DEFAULT 1,
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    
    // Bulk operations log table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS bulk_operations (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        operation_type VARCHAR(50) NOT NULL,
        operation_status VARCHAR(50) DEFAULT 'pending',
        total_records INT,
        processed_records INT DEFAULT 0,
        success_records INT DEFAULT 0,
        failed_records INT DEFAULT 0,
        input_data JSON,
        result_data JSON,
        error_log TEXT,
        performed_by VARCHAR(36),
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        FOREIGN KEY (performed_by) REFERENCES users(id)
      )
    `);
    
    // Communication logs table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS communication_logs (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
        template_used VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_used) REFERENCES email_templates(name)
      )
    `);
    
    // Student Progress table - 8 stage pipeline
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS student_progress (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        student_id VARCHAR(36) NOT NULL,
        university_id VARCHAR(36) NOT NULL,
        stage_id INT NOT NULL,
        stage_name VARCHAR(100),
        status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
        start_date TIMESTAMP,
        completed_date TIMESTAMP,
        notes TEXT,
        updated_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
      )
    `);
    
    // Student Applications table (multi-university)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS student_applications (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        student_id VARCHAR(36) NOT NULL,
        university_id VARCHAR(36) NOT NULL,
        tracking_code VARCHAR(50),
        application_status VARCHAR(50) DEFAULT 'pending',
        priority INT DEFAULT 1,
        is_primary BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
      )
    `);
    
    // Scheduled Reminders table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS scheduled_reminders (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        recipient_role VARCHAR(50) DEFAULT 'student',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        reminder_type VARCHAR(50) DEFAULT 'payment',
        related_entity_type VARCHAR(100),
        related_entity_id VARCHAR(36),
        scheduled_date TIMESTAMP NOT NULL,
        is_recurring BOOLEAN DEFAULT FALSE,
        recurrence_pattern VARCHAR(100),
        is_sent BOOLEAN DEFAULT FALSE,
        sent_at TIMESTAMP,
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Analytics Metrics table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS analytics_metrics (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        metric_name VARCHAR(100) NOT NULL,
        metric_category VARCHAR(100),
        metric_value DECIMAL(15,4),
        metric_data JSON,
        dimension1 VARCHAR(100),
        dimension2 VARCHAR(100),
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // User Preferences table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL UNIQUE,
        language VARCHAR(10) DEFAULT 'vi',
        theme VARCHAR(20) DEFAULT 'light',
        email_notifications BOOLEAN DEFAULT TRUE,
        sms_notifications BOOLEAN DEFAULT FALSE,
        push_notifications BOOLEAN DEFAULT TRUE,
        timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
        date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
        preferences_data JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Two-Factor Authentication table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_2fa (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL UNIQUE,
        secret VARCHAR(255) NOT NULL,
        backup_codes JSON,
        is_enabled BOOLEAN DEFAULT FALSE,
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // User Sessions table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        session_token VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        device_info VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Saved Filters table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS saved_filters (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        filter_name VARCHAR(255) NOT NULL,
        filter_type VARCHAR(100) NOT NULL,
        filter_criteria JSON NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create indexes for all tables (MySQL doesn't support IF NOT EXISTS for indexes)
    const createIndexIfNotExists = async (indexName, table, columns) => {
      try {
        await pool.execute(`CREATE INDEX ${indexName} ON ${table}(${columns})`);
      } catch (err) {
        if (err.code !== 'ER_DUP_KEYNAME' && !err.message.includes('Duplicate key name')) {
          throw err;
        }
        // Index already exists, ignore
      }
    };
    
    // Indexes for all tables
    await createIndexIfNotExists('idx_users_email', 'users', 'email');
    await createIndexIfNotExists('idx_users_role', 'users', 'role');
    await createIndexIfNotExists('idx_users_is_active', 'users', 'is_active');
    
    await createIndexIfNotExists('idx_universities_name', 'universities', 'name');
    await createIndexIfNotExists('idx_universities_is_active', 'universities', 'is_active');
    
    await createIndexIfNotExists('idx_registrations_student', 'registrations', 'student_id');
    await createIndexIfNotExists('idx_registrations_university', 'registrations', 'university_id');
    await createIndexIfNotExists('idx_registrations_status', 'registrations', 'status');
    
    await createIndexIfNotExists('idx_payments_student', 'payments', 'student_id');
    await createIndexIfNotExists('idx_payments_status', 'payments', 'status');
    await createIndexIfNotExists('idx_documents_student', 'documents', 'student_id');
    await createIndexIfNotExists('idx_notifications_user', 'notifications', 'user_id');
    await createIndexIfNotExists('idx_programs_university', 'programs', 'university_id');
    await createIndexIfNotExists('idx_student_profiles_user', 'student_profiles', 'user_id');
    await createIndexIfNotExists('idx_messages_sender', 'messages', 'sender_id');
    await createIndexIfNotExists('idx_messages_recipient', 'messages', 'recipient_id');
    await createIndexIfNotExists('idx_application_timeline_registration', 'application_timeline', 'registration_id');
    
    // Feature tables indexes
    await createIndexIfNotExists('idx_appointments_student', 'appointments', 'student_id');
    await createIndexIfNotExists('idx_appointments_start_time', 'appointments', 'start_time');
    await createIndexIfNotExists('idx_scholarships_university', 'scholarships', 'university_id');
    await createIndexIfNotExists('idx_scholarship_apps_student', 'scholarship_applications', 'student_id');
    await createIndexIfNotExists('idx_visa_apps_student', 'visa_applications', 'student_id');
    await createIndexIfNotExists('idx_university_ratings_university', 'university_ratings', 'university_id');
    await createIndexIfNotExists('idx_service_feedback_student', 'service_feedback', 'student_id');
    await createIndexIfNotExists('idx_email_templates_name', 'email_templates', 'name');
    await createIndexIfNotExists('idx_workflow_rules_active', 'workflow_rules', 'is_active');
    await createIndexIfNotExists('idx_bulk_operations_status', 'bulk_operations', 'operation_status');
    await createIndexIfNotExists('idx_comm_logs_recipient', 'communication_logs', 'recipient_email');
    await createIndexIfNotExists('idx_student_progress_student', 'student_progress', 'student_id');
    await createIndexIfNotExists('idx_student_applications_student', 'student_applications', 'student_id');
    await createIndexIfNotExists('idx_scheduled_reminders_user', 'scheduled_reminders', 'user_id');
    await createIndexIfNotExists('idx_user_preferences_user', 'user_preferences', 'user_id');
    await createIndexIfNotExists('idx_user_sessions_user', 'user_sessions', 'user_id');
    await createIndexIfNotExists('idx_saved_filters_user', 'saved_filters', 'user_id');
    
    // Seed default admin user if no users exist
    try {
      const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
      if (userCount[0].count === 0) {
        const bcrypt = await import('bcryptjs');
        const { v4: uuidv4 } = await import('uuid');
        const adminId = uuidv4();
        const adminHash = await bcrypt.hash('admin123', 12);
        
        await pool.execute(
          'INSERT INTO users (id, name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
          [adminId, 'Administrator', 'admin@duhoccost.vn', adminHash, 'admin', true]
        );
        
        logger.info('Default admin user created', { email: 'admin@duhoccost.vn', password: 'admin123' });
        console.log('\n✅ Default admin created: admin@duhoccost.vn / admin123\n');
      }
    } catch (seedError) {
      logger.warn('Could not seed admin user', { error: seedError.message });
    }
    
    logger.info('MySQL database initialized');
  } catch (error) {
    logger.error('Failed to initialize MySQL database', { error: error.message });
    throw error;
  }
}

// Graceful shutdown
export async function closeMySQLPool() {
  if (mysqlPool) {
    await mysqlPool.end();
    logger.info('MySQL pool closed');
  }
}
