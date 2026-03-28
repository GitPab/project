import initSqlJs from 'sql.js';

let SQL: any = null;
let db: any = null;
let initPromise: Promise<any> | null = null;
let initError: Error | null = null;

const DB_STORAGE_KEY = 'sacma_sqlite_db';

export async function initDatabase(): Promise<any> {
  if (db) return db;
  if (initError) throw initError;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      console.log('Initializing SQL.js...');
      
      // Try multiple WASM sources
      const wasmUrls = [
        `${window.location.origin}/sql-wasm.wasm`,
        'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm',
        'https://unpkg.com/sql.js@1.8.0/dist/sql-wasm.wasm'
      ];
      
      let wasmBinary: ArrayBuffer | null = null;
      let lastError: Error | null = null;
      
      for (const wasmUrl of wasmUrls) {
        try {
          console.log('Trying WASM from:', wasmUrl);
          const response = await fetch(wasmUrl);
          if (response.ok) {
            wasmBinary = await response.arrayBuffer();
            console.log('WASM loaded from', wasmUrl, 'size:', wasmBinary.byteLength, 'bytes');
            break;
          }
        } catch (e) {
          lastError = e as Error;
          console.warn('Failed to load WASM from', wasmUrl, e);
        }
      }
      
      if (!wasmBinary) {
        throw new Error(`Failed to load WASM from all sources. Last error: ${lastError?.message}`);
      }
      
      // Initialize SQL.js with the binary
      SQL = await initSqlJs({
        wasmBinary: new Uint8Array(wasmBinary)
      });
      
      console.log('SQL.js initialized successfully');
      
      // Try to load existing database from localStorage
      const storedData = localStorage.getItem(DB_STORAGE_KEY);
      if (storedData) {
        console.log('Restoring database from localStorage...');
        const uint8Array = new Uint8Array(storedData.split(',').map(Number));
        db = new SQL.Database(uint8Array);
        console.log('Database restored, size:', uint8Array.length, 'bytes');
        // Run schema migration to add missing columns
        await migrateSchema();
      } else {
        console.log('Creating new database...');
        db = new SQL.Database();
        await initializeSchema();
      }
      
      // Auto-save on page unload
      window.addEventListener('beforeunload', saveDatabase);
      
      initError = null;
      return db;
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      initError = error as Error;
      initPromise = null;
      throw error;
    }
  })();
  
  return initPromise;
}

export function saveDatabase(): void {
  if (!db || !SQL) return;
  
  try {
    const data = db.export();
    const array = Array.from(data);
    localStorage.setItem(DB_STORAGE_KEY, array.join(','));
  } catch (error) {
    console.error('Failed to save database:', error);
  }
}

export async function initializeSchema(): Promise<void> {
  if (!db) await initDatabase();
  
  // Universities table
  db.run(`
    CREATE TABLE IF NOT EXISTS universities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_korean TEXT,
      region TEXT,
      top_tier TEXT,
      ranking TEXT,
      country TEXT,
      country_code TEXT,
      logo_url TEXT,
      banner_url TEXT,
      address TEXT,
      website TEXT,
      description TEXT,
      korean_data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Tracking codes table
  db.run(`
    CREATE TABLE IF NOT EXISTS tracking_codes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      student_email TEXT,
      student_name TEXT,
      student_phone TEXT,
      desired_university_id TEXT,
      desired_university_name TEXT,
      visa_system TEXT,
      topik_level TEXT,
      ielts_score TEXT,
      initial_total_cost_vnd INTEGER,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (desired_university_id) REFERENCES universities(id)
    )
  `);
  
  // Registrations table
  db.run(`
    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      university_id TEXT,
      status TEXT DEFAULT 'pending',
      total_cost_vnd INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (university_id) REFERENCES universities(id)
    )
  `);
  
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'student',
      password_hash TEXT,
      phone TEXT,
      tracking_code TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Contact requests table
  db.run(`
    CREATE TABLE IF NOT EXISTS contact_requests (
      id TEXT PRIMARY KEY,
      student_name TEXT,
      student_phone TEXT,
      student_email TEXT,
      note TEXT,
      university_id TEXT,
      university_name TEXT,
      visa_system TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (university_id) REFERENCES universities(id)
    )
  `);
  
  // Registration details table (for fee selections)
  db.run(`
    CREATE TABLE IF NOT EXISTS registration_details (
      id TEXT PRIMARY KEY,
      registration_id TEXT,
      fee_type TEXT,
      amount INTEGER,
      is_selected BOOLEAN,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (registration_id) REFERENCES registrations(id)
    )
  `);

  // Student Progress table - 8 stage pipeline
  db.run(`
    CREATE TABLE IF NOT EXISTS student_progress (
      id TEXT PRIMARY KEY,
      student_email TEXT NOT NULL,
      university_id TEXT NOT NULL,
      stage_id INTEGER NOT NULL,
      stage_name TEXT,
      status TEXT DEFAULT 'pending',
      start_date TIMESTAMP,
      completed_date TIMESTAMP,
      notes TEXT,
      updated_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (university_id) REFERENCES universities(id)
    )
  `);

  // Documents table - for hồ sơ uploads
  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      student_email TEXT NOT NULL,
      university_id TEXT,
      document_type TEXT NOT NULL,
      document_name TEXT,
      file_data TEXT,
      file_size INTEGER,
      mime_type TEXT,
      upload_type TEXT DEFAULT 'student',
      uploaded_by TEXT,
      verified BOOLEAN DEFAULT 0,
      verified_by TEXT,
      verified_at TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (university_id) REFERENCES universities(id)
    )
  `);

  // Payments table - track actual payments
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      student_email TEXT NOT NULL,
      university_id TEXT,
      payment_type TEXT NOT NULL,
      amount_vnd INTEGER,
      amount_krw INTEGER,
      amount_usd INTEGER,
      payment_method TEXT,
      transaction_id TEXT,
      payment_date TIMESTAMP,
      due_date TIMESTAMP,
      status TEXT DEFAULT 'pending',
      proof_document_id TEXT,
      notes TEXT,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (university_id) REFERENCES universities(id),
      FOREIGN KEY (proof_document_id) REFERENCES documents(id)
    )
  `);

  // Notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      recipient_email TEXT NOT NULL,
      recipient_role TEXT DEFAULT 'student',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      related_entity_type TEXT,
      related_entity_id TEXT,
      is_read BOOLEAN DEFAULT 0,
      read_at TIMESTAMP,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Audit Log table - track all admin actions
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      student_email TEXT,
      old_values TEXT,
      new_values TEXT,
      performed_by TEXT NOT NULL,
      performed_by_email TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Multi-University Applications table
  db.run(`
    CREATE TABLE IF NOT EXISTS student_applications (
      id TEXT PRIMARY KEY,
      student_email TEXT NOT NULL,
      university_id TEXT NOT NULL,
      tracking_code TEXT,
      application_status TEXT DEFAULT 'pending',
      priority INTEGER DEFAULT 1,
      is_primary BOOLEAN DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (university_id) REFERENCES universities(id),
      FOREIGN KEY (tracking_code) REFERENCES tracking_codes(code)
    )
  `);

  // ============================================
  // CALENDAR & APPOINTMENTS TABLE
  // ============================================
  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      student_email TEXT NOT NULL,
      admin_email TEXT,
      title TEXT NOT NULL,
      description TEXT,
      appointment_type TEXT DEFAULT 'consultation',
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP,
      location TEXT,
      is_online BOOLEAN DEFAULT 0,
      meeting_link TEXT,
      status TEXT DEFAULT 'scheduled',
      reminder_sent BOOLEAN DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ============================================
  // SCHOLARSHIP MANAGEMENT TABLE
  // ============================================
  db.run(`
    CREATE TABLE IF NOT EXISTS scholarships (
      id TEXT PRIMARY KEY,
      university_id TEXT,
      name TEXT NOT NULL,
      name_korean TEXT,
      description TEXT,
      amount_vnd INTEGER,
      amount_krw INTEGER,
      eligibility_criteria TEXT,
      application_deadline TIMESTAMP,
      requirements TEXT,
      is_active BOOLEAN DEFAULT 1,
      max_recipients INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (university_id) REFERENCES universities(id)
    )
  `);

  // Student Scholarship Applications
  db.run(`
    CREATE TABLE IF NOT EXISTS scholarship_applications (
      id TEXT PRIMARY KEY,
      scholarship_id TEXT NOT NULL,
      student_email TEXT NOT NULL,
      student_application_id TEXT,
      status TEXT DEFAULT 'pending',
      documents TEXT,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      decision_date TIMESTAMP,
      decision_notes TEXT,
      amount_awarded_vnd INTEGER,
      amount_awarded_krw INTEGER,
      FOREIGN KEY (scholarship_id) REFERENCES scholarships(id),
      FOREIGN KEY (student_application_id) REFERENCES student_applications(id)
    )
  `);

  // ============================================
  // VISA APPLICATION TRACKING TABLE
  // ============================================
  db.run(`
    CREATE TABLE IF NOT EXISTS visa_applications (
      id TEXT PRIMARY KEY,
      student_email TEXT NOT NULL,
      student_application_id TEXT,
      visa_type TEXT NOT NULL,
      embassy_location TEXT,
      submission_date TIMESTAMP,
      appointment_date TIMESTAMP,
      appointment_time TEXT,
      status TEXT DEFAULT 'preparing',
      visa_number TEXT,
      issue_date TIMESTAMP,
      expiry_date TIMESTAMP,
      documents_submitted TEXT,
      interview_required BOOLEAN DEFAULT 0,
      interview_date TIMESTAMP,
      interview_notes TEXT,
      rejection_reason TEXT,
      tracking_number TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_application_id) REFERENCES student_applications(id)
    )
  `);

  // ============================================
  // AUTO REMINDERS & SCHEDULED NOTIFICATIONS
  // ============================================
  db.run(`
    CREATE TABLE IF NOT EXISTS scheduled_reminders (
      id TEXT PRIMARY KEY,
      recipient_email TEXT NOT NULL,
      recipient_role TEXT DEFAULT 'student',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      reminder_type TEXT DEFAULT 'payment',
      related_entity_type TEXT,
      related_entity_id TEXT,
      scheduled_date TIMESTAMP NOT NULL,
      is_recurring BOOLEAN DEFAULT 0,
      recurrence_pattern TEXT,
      is_sent BOOLEAN DEFAULT 0,
      sent_at TIMESTAMP,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ============================================
  // ANALYTICS & METRICS TABLE
  // ============================================
  db.run(`
    CREATE TABLE IF NOT EXISTS analytics_metrics (
      id TEXT PRIMARY KEY,
      metric_name TEXT NOT NULL,
      metric_category TEXT,
      metric_value REAL,
      metric_data TEXT,
      dimension1 TEXT,
      dimension2 TEXT,
      recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ============================================
  // ROLE-BASED ACCESS CONTROL TABLES
  // ============================================
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      permissions TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User Role Assignments
  db.run(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      role_id TEXT NOT NULL,
      assigned_by TEXT,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    )
  `);

  // ============================================
  // EMAIL/SMS LOGS TABLE
  // ============================================
  db.run(`
    CREATE TABLE IF NOT EXISTS communication_logs (
      id TEXT PRIMARY KEY,
      recipient_email TEXT,
      recipient_phone TEXT,
      communication_type TEXT NOT NULL,
      subject TEXT,
      content TEXT,
      status TEXT DEFAULT 'pending',
      sent_at TIMESTAMP,
      delivered_at TIMESTAMP,
      opened_at TIMESTAMP,
      error_message TEXT,
      template_used TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ============================================
  // STUDENT FEEDBACK & RATINGS TABLE
  // ============================================
  db.run(`
    CREATE TABLE IF NOT EXISTS university_ratings (
      id TEXT PRIMARY KEY,
      university_id TEXT NOT NULL,
      student_email TEXT NOT NULL,
      student_application_id TEXT,
      overall_rating INTEGER,
      teaching_quality INTEGER,
      facilities INTEGER,
      support_services INTEGER,
      value_for_money INTEGER,
      review_title TEXT,
      review_text TEXT,
      is_approved BOOLEAN DEFAULT 0,
      approved_by TEXT,
      approved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (university_id) REFERENCES universities(id)
    )
  `);

  // Service Feedback
  db.run(`
    CREATE TABLE IF NOT EXISTS service_feedback (
      id TEXT PRIMARY KEY,
      student_email TEXT NOT NULL,
      feedback_type TEXT DEFAULT 'general',
      rating INTEGER,
      feedback_text TEXT,
      is_resolved BOOLEAN DEFAULT 0,
      resolved_by TEXT,
      resolved_at TIMESTAMP,
      resolution_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ============================================
  // EMAIL TEMPLATES TABLE
  // ============================================
  db.run(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      template_type TEXT DEFAULT 'general',
      variables TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ============================================
  // WORKFLOW AUTOMATION RULES TABLE
  // ============================================
  db.run(`
    CREATE TABLE IF NOT EXISTS workflow_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      trigger_type TEXT NOT NULL,
      trigger_condition TEXT NOT NULL,
      action_type TEXT NOT NULL,
      action_config TEXT,
      is_active BOOLEAN DEFAULT 1,
      priority INTEGER DEFAULT 1,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ============================================
  // USER PREFERENCES TABLE
  // ============================================
  db.run(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL UNIQUE,
      language TEXT DEFAULT 'vi',
      theme TEXT DEFAULT 'light',
      email_notifications BOOLEAN DEFAULT 1,
      sms_notifications BOOLEAN DEFAULT 0,
      push_notifications BOOLEAN DEFAULT 1,
      timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
      date_format TEXT DEFAULT 'DD/MM/YYYY',
      preferences_data TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ============================================
  // TWO-FACTOR AUTHENTICATION TABLE
  // ============================================
  db.run(`
    CREATE TABLE IF NOT EXISTS user_2fa (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL UNIQUE,
      secret TEXT NOT NULL,
      backup_codes TEXT,
      is_enabled BOOLEAN DEFAULT 0,
      verified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ============================================
  // USER SESSIONS TABLE
  // ============================================
  db.run(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      session_token TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      device_info TEXT,
      is_active BOOLEAN DEFAULT 1,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ============================================
  // BULK OPERATIONS LOG TABLE
  // ============================================
  db.run(`
    CREATE TABLE IF NOT EXISTS bulk_operations (
      id TEXT PRIMARY KEY,
      operation_type TEXT NOT NULL,
      operation_status TEXT DEFAULT 'pending',
      total_records INTEGER,
      processed_records INTEGER DEFAULT 0,
      success_records INTEGER DEFAULT 0,
      failed_records INTEGER DEFAULT 0,
      input_data TEXT,
      result_data TEXT,
      error_log TEXT,
      performed_by TEXT,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    )
  `);

  // ============================================
  // ADVANCED SEARCH FILTERS TABLE
  // ============================================
  db.run(`
    CREATE TABLE IF NOT EXISTS saved_filters (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      filter_name TEXT NOT NULL,
      filter_type TEXT NOT NULL,
      filter_criteria TEXT NOT NULL,
      is_default BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  saveDatabase();
}

// Schema migration - add missing columns to existing tables
async function migrateSchema(): Promise<void> {
  if (!db) return;
  
  console.log('Running schema migration...');
  
  try {
    // Check if users table has phone column
    const tableInfo = db.exec("PRAGMA table_info(users)");
    const columns = tableInfo[0]?.values.map((row: any[]) => row[1]) || [];
    
    if (!columns.includes('phone')) {
      console.log('Adding phone column to users table...');
      db.run('ALTER TABLE users ADD COLUMN phone TEXT');
    }
    
    if (!columns.includes('tracking_code')) {
      console.log('Adding tracking_code column to users table...');
      db.run('ALTER TABLE users ADD COLUMN tracking_code TEXT');
    }
    
    // Check if student_applications table exists
    const tableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='student_applications'");
    if (!tableCheck[0]?.values.length) {
      console.log('Creating student_applications table...');
      db.run(`
        CREATE TABLE IF NOT EXISTS student_applications (
          id TEXT PRIMARY KEY,
          student_email TEXT NOT NULL,
          university_id TEXT NOT NULL,
          tracking_code TEXT,
          application_status TEXT DEFAULT 'pending',
          priority INTEGER DEFAULT 1,
          is_primary BOOLEAN DEFAULT 0,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (university_id) REFERENCES universities(id),
          FOREIGN KEY (tracking_code) REFERENCES tracking_codes(code)
        )
      `);
    }
    
    console.log('Schema migration complete');
    saveDatabase();
  } catch (error) {
    console.error('Schema migration failed:', error);
  }
}

// Contact Requests Database Functions
export function saveContactRequest(data: {
  id: string;
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  note: string;
  universityId?: string;
  universityName?: string;
  visaSystem?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO contact_requests (
      id, student_name, student_phone, student_email, note,
      university_id, university_name, visa_system, status, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.studentName,
    data.studentPhone,
    data.studentEmail,
    data.note,
    data.universityId || null,
    data.universityName || null,
    data.visaSystem || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getContactRequests(universityId?: string): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM contact_requests';
  const params: any[] = [];
  
  if (universityId) {
    query += ' WHERE university_id = ?';
    params.push(universityId);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const stmt = db.prepare(query);
  if (params.length) stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

// Registration Database Functions
export function saveRegistration(data: {
  id: string;
  studentId?: string;
  universityId: string;
  selectedFees: {
    visa: boolean;
    accommodation: boolean;
    insurance: boolean;
    additional: boolean[];
  };
  totalCostVND: number;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  // Save main registration
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO registrations (
      id, student_id, university_id, status, total_cost_vnd, updated_at
    ) VALUES (?, ?, ?, 'active', ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.studentId || null,
    data.universityId,
    data.totalCostVND
  ]);
  
  stmt.step();
  stmt.free();
  
  // Delete old fee details
  const deleteStmt = db.prepare('DELETE FROM registration_details WHERE registration_id = ?');
  deleteStmt.bind([data.id]);
  deleteStmt.step();
  deleteStmt.free();
  
  // Insert new fee details
  const feeTypes = [
    { type: 'visa', selected: data.selectedFees.visa },
    { type: 'accommodation', selected: data.selectedFees.accommodation },
    { type: 'insurance', selected: data.selectedFees.insurance }
  ];
  
  data.selectedFees.additional.forEach((selected, index) => {
    feeTypes.push({ type: `additional_${index}`, selected });
  });
  
  const detailStmt = db.prepare(`
    INSERT INTO registration_details (id, registration_id, fee_type, is_selected)
    VALUES (?, ?, ?, ?)
  `);
  
  feeTypes.forEach(fee => {
    detailStmt.bind([`${data.id}_${fee.type}`, data.id, fee.type, fee.selected ? 1 : 0]);
    detailStmt.step();
    detailStmt.reset();
  });
  
  detailStmt.free();
  saveDatabase();
}

export function getRegistrations(studentId?: string, universityId?: string): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM registrations WHERE 1=1';
  const params: any[] = [];
  
  if (studentId) {
    query += ' AND student_id = ?';
    params.push(studentId);
  }
  
  if (universityId) {
    query += ' AND university_id = ?';
    params.push(universityId);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const stmt = db.prepare(query);
  if (params.length) stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    const reg = stmt.getAsObject();
    
    // Get fee details
    const detailStmt = db.prepare('SELECT * FROM registration_details WHERE registration_id = ?');
    detailStmt.bind([reg.id]);
    const details: any[] = [];
    while (detailStmt.step()) {
      details.push(detailStmt.getAsObject());
    }
    detailStmt.free();
    
    reg.feeDetails = details;
    results.push(reg);
  }
  stmt.free();
  
  return results;
}

export function updateRegistrationStatus(id: string, status: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    UPDATE registrations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  
  stmt.bind([status, id]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function deleteRegistration(id: string): void {
  if (!db) throw new Error('Database not initialized');
  
  // Delete fee details first
  const detailStmt = db.prepare('DELETE FROM registration_details WHERE registration_id = ?');
  detailStmt.bind([id]);
  detailStmt.step();
  detailStmt.free();
  
  // Delete registration
  const stmt = db.prepare('DELETE FROM registrations WHERE id = ?');
  stmt.bind([id]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

// User Authentication Functions
export function saveUser(data: {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'student';
  password_hash?: string;
  phone?: string;
  tracking_code?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO users (
      id, email, name, role, password_hash, phone, tracking_code, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.email,
    data.name,
    data.role,
    data.password_hash || null,
    data.phone || null,
    data.tracking_code || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getUserByEmail(email: string): any | null {
  if (!db) return null; // Return null instead of throwing
  
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    stmt.bind([email]);
    
    let result = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    
    return result;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

export function getUserById(id: string): any | null {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  stmt.bind([id]);
  
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  
  return result;
}

export function getAllUsers(): any[] {
  if (!db) return []; // Return empty array instead of throwing
  
  try {
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    const results: any[] = [];
    
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    
    return results;
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

export function deleteUser(id: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  stmt.bind([id]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getDatabase(): any {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function runQuery(query: string, params?: any[]): any[] {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  const stmt = db.prepare(query);
  const results: any[] = [];
  
  if (params) {
    stmt.bind(params);
  }
  
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  
  stmt.free();
  return results;
}

export function runExec(query: string): void {
  if (!db) {
    throw new Error('Database not initialized');
  }
  db.run(query);
  saveDatabase();
}

export async function resetDatabase(): Promise<void> {
  if (db) {
    db.close();
    db = null;
  }
  localStorage.removeItem(DB_STORAGE_KEY);
  await initDatabase();
}

// Export database to a downloadable SQLite file
export function exportDatabaseToFile(filename: string = 'sacma_database.db'): void {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  // Export the database as Uint8Array
  const data = db.export();
  
  // Create blob and download
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// Import database from file
export async function importDatabaseFromFile(file: File): Promise<void> {
  if (!SQL) {
    await initDatabase();
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Close existing database
        if (db) {
          db.close();
        }
        
        // Create new database from file
        db = new SQL.Database(uint8Array);
        
        // Save to localStorage
        saveDatabase();
        
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// ============================================
// STUDENT PROGRESS FUNCTIONS
// ============================================

export function saveStudentProgress(data: {
  id: string;
  studentEmail: string;
  universityId: string;
  stageId: number;
  stageName: string;
  status: 'pending' | 'in-progress' | 'completed';
  startDate?: string;
  completedDate?: string;
  notes?: string;
  updatedBy?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO student_progress (
      id, student_email, university_id, stage_id, stage_name, status,
      start_date, completed_date, notes, updated_by, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.studentEmail,
    data.universityId,
    data.stageId,
    data.stageName,
    data.status,
    data.startDate || null,
    data.completedDate || null,
    data.notes || null,
    data.updatedBy || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getStudentProgress(studentEmail: string, universityId?: string): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM student_progress WHERE student_email = ?';
  const params: any[] = [studentEmail];
  
  if (universityId) {
    query += ' AND university_id = ?';
    params.push(universityId);
  }
  
  query += ' ORDER BY stage_id ASC';
  
  const stmt = db.prepare(query);
  stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

export function getAllStudentProgress(): any[] {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare('SELECT * FROM student_progress ORDER BY created_at DESC');
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

export function updateProgressStatus(
  id: string, 
  status: 'pending' | 'in-progress' | 'completed',
  updatedBy?: string,
  notes?: string
): void {
  if (!db) throw new Error('Database not initialized');
  
  const updates: string[] = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
  const params: any[] = [status];
  
  if (status === 'in-progress') {
    updates.push('start_date = COALESCE(start_date, CURRENT_TIMESTAMP)');
  }
  if (status === 'completed') {
    updates.push('completed_date = CURRENT_TIMESTAMP');
  }
  if (updatedBy) {
    updates.push('updated_by = ?');
    params.push(updatedBy);
  }
  if (notes) {
    updates.push('notes = ?');
    params.push(notes);
  }
  
  params.push(id);
  
  const stmt = db.prepare(`
    UPDATE student_progress SET ${updates.join(', ')} WHERE id = ?
  `);
  stmt.bind(params);
  stmt.step();
  stmt.free();
  saveDatabase();
}

// ============================================
// DOCUMENT FUNCTIONS
// ============================================

export function saveDocument(data: {
  id: string;
  studentEmail: string;
  universityId?: string;
  documentType: string;
  documentName: string;
  fileData: string;
  fileSize: number;
  mimeType: string;
  uploadType?: 'student' | 'admin';
  uploadedBy?: string;
  notes?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO documents (
      id, student_email, university_id, document_type, document_name,
      file_data, file_size, mime_type, upload_type, uploaded_by, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.studentEmail,
    data.universityId || null,
    data.documentType,
    data.documentName,
    data.fileData,
    data.fileSize,
    data.mimeType,
    data.uploadType || 'student',
    data.uploadedBy || null,
    data.notes || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getDocuments(studentEmail?: string, universityId?: string): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM documents WHERE 1=1';
  const params: any[] = [];
  
  if (studentEmail) {
    query += ' AND student_email = ?';
    params.push(studentEmail);
  }
  if (universityId) {
    query += ' AND university_id = ?';
    params.push(universityId);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const stmt = db.prepare(query);
  if (params.length) stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

export function verifyDocument(id: string, verifiedBy: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    UPDATE documents 
    SET verified = 1, verified_by = ?, verified_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  stmt.bind([verifiedBy, id]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function deleteDocument(id: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare('DELETE FROM documents WHERE id = ?');
  stmt.bind([id]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

// ============================================
// PAYMENT FUNCTIONS
// ============================================

export function savePayment(data: {
  id: string;
  studentEmail: string;
  universityId?: string;
  paymentType: string;
  amountVnd?: number;
  amountKrw?: number;
  amountUsd?: number;
  paymentMethod?: string;
  transactionId?: string;
  paymentDate?: string;
  dueDate?: string;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  proofDocumentId?: string;
  notes?: string;
  createdBy?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO payments (
      id, student_email, university_id, payment_type, amount_vnd, amount_krw, amount_usd,
      payment_method, transaction_id, payment_date, due_date, status,
      proof_document_id, notes, created_by, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.studentEmail,
    data.universityId || null,
    data.paymentType,
    data.amountVnd || null,
    data.amountKrw || null,
    data.amountUsd || null,
    data.paymentMethod || null,
    data.transactionId || null,
    data.paymentDate || null,
    data.dueDate || null,
    data.status || 'pending',
    data.proofDocumentId || null,
    data.notes || null,
    data.createdBy || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getPayments(studentEmail?: string, universityId?: string): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM payments WHERE 1=1';
  const params: any[] = [];
  
  if (studentEmail) {
    query += ' AND student_email = ?';
    params.push(studentEmail);
  }
  if (universityId) {
    query += ' AND university_id = ?';
    params.push(universityId);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const stmt = db.prepare(query);
  if (params.length) stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

export function updatePaymentStatus(id: string, status: 'pending' | 'completed' | 'failed' | 'refunded'): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  stmt.bind([status, id]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

export function createNotification(data: {
  id: string;
  recipientEmail: string;
  recipientRole?: 'student' | 'admin';
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdBy?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT INTO notifications (
      id, recipient_email, recipient_role, title, message, type,
      related_entity_type, related_entity_id, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.recipientEmail,
    data.recipientRole || 'student',
    data.title,
    data.message,
    data.type || 'info',
    data.relatedEntityType || null,
    data.relatedEntityId || null,
    data.createdBy || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getNotifications(recipientEmail?: string, isRead?: boolean): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM notifications WHERE 1=1';
  const params: any[] = [];
  
  if (recipientEmail) {
    query += ' AND recipient_email = ?';
    params.push(recipientEmail);
  }
  if (isRead !== undefined) {
    query += ' AND is_read = ?';
    params.push(isRead ? 1 : 0);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const stmt = db.prepare(query);
  if (params.length) stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

export function markNotificationAsRead(id: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  stmt.bind([id]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function deleteNotification(id: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare('DELETE FROM notifications WHERE id = ?');
  stmt.bind([id]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

// ============================================
// AUDIT LOG FUNCTIONS
// ============================================

export function createAuditLog(data: {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  studentEmail?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  performedBy: string;
  performedByEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT INTO audit_logs (
      id, action, entity_type, entity_id, student_email,
      old_values, new_values, performed_by, performed_by_email,
      ip_address, user_agent, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.action,
    data.entityType,
    data.entityId || null,
    data.studentEmail || null,
    data.oldValues ? JSON.stringify(data.oldValues) : null,
    data.newValues ? JSON.stringify(data.newValues) : null,
    data.performedBy,
    data.performedByEmail || null,
    data.ipAddress || null,
    data.userAgent || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getAuditLogs(
  entityType?: string, 
  studentEmail?: string, 
  performedBy?: string,
  limit: number = 100
): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: any[] = [];
  
  if (entityType) {
    query += ' AND entity_type = ?';
    params.push(entityType);
  }
  if (studentEmail) {
    query += ' AND student_email = ?';
    params.push(studentEmail);
  }
  if (performedBy) {
    query += ' AND performed_by = ?';
    params.push(performedBy);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);
  
  const stmt = db.prepare(query);
  stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

// ============================================
// MULTI-UNIVERSITY APPLICATION FUNCTIONS
// ============================================

export function saveStudentApplication(data: {
  id: string;
  studentEmail: string;
  universityId: string;
  trackingCode?: string;
  applicationStatus?: string;
  priority?: number;
  isPrimary?: boolean;
  notes?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO student_applications (
      id, student_email, university_id, tracking_code, application_status,
      priority, is_primary, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.studentEmail,
    data.universityId,
    data.trackingCode || null,
    data.applicationStatus || 'pending',
    data.priority || 1,
    data.isPrimary ? 1 : 0,
    data.notes || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getStudentApplications(studentEmail: string): any[] {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    SELECT a.*, u.name as university_name, u.name_korean as university_name_korean
    FROM student_applications a
    LEFT JOIN universities u ON a.university_id = u.id
    WHERE a.student_email = ?
    ORDER BY a.priority ASC, a.created_at DESC
  `);
  stmt.bind([studentEmail]);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

export function getAllApplications(universityId?: string): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = `
    SELECT a.*, u.name as university_name, tc.student_name, tc.student_phone
    FROM student_applications a
    LEFT JOIN universities u ON a.university_id = u.id
    LEFT JOIN tracking_codes tc ON a.tracking_code = tc.code
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (universityId) {
    query += ' AND a.university_id = ?';
    params.push(universityId);
  }
  
  query += ' ORDER BY a.created_at DESC';
  
  const stmt = db.prepare(query);
  if (params.length) stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

export function updateApplicationStatus(id: string, status: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    UPDATE student_applications SET application_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  stmt.bind([status, id]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

// ============================================
// CALENDAR & APPOINTMENTS FUNCTIONS
// ============================================

export function saveAppointment(data: {
  id: string;
  studentEmail: string;
  adminEmail?: string;
  title: string;
  description?: string;
  appointmentType?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  isOnline?: boolean;
  meetingLink?: string;
  status?: string;
  notes?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO appointments (
      id, student_email, admin_email, title, description, appointment_type,
      start_time, end_time, location, is_online, meeting_link, status, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.studentEmail,
    data.adminEmail || null,
    data.title,
    data.description || null,
    data.appointmentType || 'consultation',
    data.startTime,
    data.endTime || null,
    data.location || null,
    data.isOnline ? 1 : 0,
    data.meetingLink || null,
    data.status || 'scheduled',
    data.notes || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getAppointments(studentEmail?: string, adminEmail?: string, startDate?: string, endDate?: string): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM appointments WHERE 1=1';
  const params: any[] = [];
  
  if (studentEmail) {
    query += ' AND student_email = ?';
    params.push(studentEmail);
  }
  if (adminEmail) {
    query += ' AND admin_email = ?';
    params.push(adminEmail);
  }
  if (startDate) {
    query += ' AND start_time >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND start_time <= ?';
    params.push(endDate);
  }
  
  query += ' ORDER BY start_time ASC';
  
  const stmt = db.prepare(query);
  if (params.length) stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

export function updateAppointmentStatus(id: string, status: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  stmt.bind([status, id]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function deleteAppointment(id: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare('DELETE FROM appointments WHERE id = ?');
  stmt.bind([id]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

// ============================================
// SCHOLARSHIP FUNCTIONS
// ============================================

export function saveScholarship(data: {
  id: string;
  universityId?: string;
  name: string;
  nameKorean?: string;
  description?: string;
  amountVnd?: number;
  amountKrw?: number;
  eligibilityCriteria?: string;
  applicationDeadline?: string;
  requirements?: string;
  isActive?: boolean;
  maxRecipients?: number;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO scholarships (
      id, university_id, name, name_korean, description, amount_vnd, amount_krw,
      eligibility_criteria, application_deadline, requirements, is_active, max_recipients, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.universityId || null,
    data.name,
    data.nameKorean || null,
    data.description || null,
    data.amountVnd || null,
    data.amountKrw || null,
    data.eligibilityCriteria || null,
    data.applicationDeadline || null,
    data.requirements || null,
    data.isActive !== false ? 1 : 0,
    data.maxRecipients || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getScholarships(universityId?: string, isActive?: boolean): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM scholarships WHERE 1=1';
  const params: any[] = [];
  
  if (universityId) {
    query += ' AND university_id = ?';
    params.push(universityId);
  }
  if (isActive !== undefined) {
    query += ' AND is_active = ?';
    params.push(isActive ? 1 : 0);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const stmt = db.prepare(query);
  if (params.length) stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

export function deleteScholarship(id: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare('DELETE FROM scholarships WHERE id = ?');
  stmt.bind([id]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function saveScholarshipApplication(data: {
  id: string;
  scholarshipId: string;
  studentEmail: string;
  studentApplicationId?: string;
  status?: string;
  documents?: string;
  amountAwardedVnd?: number;
  amountAwardedKrw?: number;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO scholarship_applications (
      id, scholarship_id, student_email, student_application_id, status, documents,
      amount_awarded_vnd, amount_awarded_krw
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.bind([
    data.id,
    data.scholarshipId,
    data.studentEmail,
    data.studentApplicationId || null,
    data.status || 'pending',
    data.documents || null,
    data.amountAwardedVnd || null,
    data.amountAwardedKrw || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

// ============================================
// VISA APPLICATION FUNCTIONS
// ============================================

export function saveVisaApplication(data: {
  id: string;
  studentEmail: string;
  studentApplicationId?: string;
  visaType: string;
  embassyLocation?: string;
  submissionDate?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  status?: string;
  visaNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  documentsSubmitted?: string;
  interviewRequired?: boolean;
  interviewDate?: string;
  interviewNotes?: string;
  rejectionReason?: string;
  trackingNumber?: string;
  notes?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO visa_applications (
      id, student_email, student_application_id, visa_type, embassy_location,
      submission_date, appointment_date, appointment_time, status, visa_number,
      issue_date, expiry_date, documents_submitted, interview_required, interview_date,
      interview_notes, rejection_reason, tracking_number, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.studentEmail,
    data.studentApplicationId || null,
    data.visaType,
    data.embassyLocation || null,
    data.submissionDate || null,
    data.appointmentDate || null,
    data.appointmentTime || null,
    data.status || 'preparing',
    data.visaNumber || null,
    data.issueDate || null,
    data.expiryDate || null,
    data.documentsSubmitted || null,
    data.interviewRequired ? 1 : 0,
    data.interviewDate || null,
    data.interviewNotes || null,
    data.rejectionReason || null,
    data.trackingNumber || null,
    data.notes || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getVisaApplications(studentEmail?: string, status?: string): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM visa_applications WHERE 1=1';
  const params: any[] = [];
  
  if (studentEmail) {
    query += ' AND student_email = ?';
    params.push(studentEmail);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const stmt = db.prepare(query);
  if (params.length) stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

// ============================================
// SCHEDULED REMINDERS FUNCTIONS
// ============================================

export function saveScheduledReminder(data: {
  id: string;
  recipientEmail: string;
  recipientRole?: string;
  title: string;
  message: string;
  reminderType?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  scheduledDate: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
  createdBy?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT INTO scheduled_reminders (
      id, recipient_email, recipient_role, title, message, reminder_type,
      related_entity_type, related_entity_id, scheduled_date, is_recurring,
      recurrence_pattern, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.recipientEmail,
    data.recipientRole || 'student',
    data.title,
    data.message,
    data.reminderType || 'payment',
    data.relatedEntityType || null,
    data.relatedEntityId || null,
    data.scheduledDate,
    data.isRecurring ? 1 : 0,
    data.recurrencePattern || null,
    data.createdBy || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getScheduledReminders(recipientEmail?: string, isSent?: boolean): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM scheduled_reminders WHERE 1=1';
  const params: any[] = [];
  
  if (recipientEmail) {
    query += ' AND recipient_email = ?';
    params.push(recipientEmail);
  }
  if (isSent !== undefined) {
    query += ' AND is_sent = ?';
    params.push(isSent ? 1 : 0);
  }
  
  query += ' ORDER BY scheduled_date ASC';
  
  const stmt = db.prepare(query);
  if (params.length) stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

export function markReminderAsSent(id: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    UPDATE scheduled_reminders SET is_sent = 1, sent_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  stmt.bind([id]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

export function saveAnalyticsMetric(data: {
  id: string;
  metricName: string;
  metricCategory?: string;
  metricValue?: number;
  metricData?: string;
  dimension1?: string;
  dimension2?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT INTO analytics_metrics (
      id, metric_name, metric_category, metric_value, metric_data, dimension1, dimension2, recorded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.metricName,
    data.metricCategory || null,
    data.metricValue || null,
    data.metricData || null,
    data.dimension1 || null,
    data.dimension2 || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getAnalyticsMetrics(metricName?: string, startDate?: string, endDate?: string): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM analytics_metrics WHERE 1=1';
  const params: any[] = [];
  
  if (metricName) {
    query += ' AND metric_name = ?';
    params.push(metricName);
  }
  if (startDate) {
    query += ' AND recorded_at >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND recorded_at <= ?';
    params.push(endDate);
  }
  
  query += ' ORDER BY recorded_at DESC';
  
  const stmt = db.prepare(query);
  if (params.length) stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

// ============================================
// ROLE-BASED ACCESS CONTROL FUNCTIONS
// ============================================

export function saveRole(data: {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO roles (id, name, description, permissions, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.name,
    data.description || null,
    JSON.stringify(data.permissions)
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getRoles(): any[] {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare('SELECT * FROM roles ORDER BY created_at DESC');
  const results: any[] = [];
  while (stmt.step()) {
    const role = stmt.getAsObject();
    role.permissions = JSON.parse(role.permissions || '[]');
    results.push(role);
  }
  stmt.free();
  
  return results;
}

export function assignRoleToUser(data: {
  id: string;
  userEmail: string;
  roleId: string;
  assignedBy?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO user_roles (id, user_email, role_id, assigned_by, assigned_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.userEmail,
    data.roleId,
    data.assignedBy || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getUserRoles(userEmail: string): any[] {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    SELECT r.* FROM roles r
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_email = ?
  `);
  stmt.bind([userEmail]);
  
  const results: any[] = [];
  while (stmt.step()) {
    const role = stmt.getAsObject();
    role.permissions = JSON.parse(role.permissions || '[]');
    results.push(role);
  }
  stmt.free();
  
  return results;
}

// ============================================
// COMMUNICATION LOGS FUNCTIONS
// ============================================

export function saveCommunicationLog(data: {
  id: string;
  recipientEmail?: string;
  recipientPhone?: string;
  communicationType: 'email' | 'sms';
  subject?: string;
  content?: string;
  status?: string;
  templateUsed?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT INTO communication_logs (
      id, recipient_email, recipient_phone, communication_type, subject, content,
      status, template_used, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.recipientEmail || null,
    data.recipientPhone || null,
    data.communicationType,
    data.subject || null,
    data.content || null,
    data.status || 'pending',
    data.templateUsed || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getCommunicationLogs(recipientEmail?: string, type?: string): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM communication_logs WHERE 1=1';
  const params: any[] = [];
  
  if (recipientEmail) {
    query += ' AND recipient_email = ?';
    params.push(recipientEmail);
  }
  if (type) {
    query += ' AND communication_type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const stmt = db.prepare(query);
  if (params.length) stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

// ============================================
// STUDENT FEEDBACK FUNCTIONS
// ============================================

export function saveUniversityRating(data: {
  id: string;
  universityId: string;
  studentEmail: string;
  studentApplicationId?: string;
  overallRating?: number;
  teachingQuality?: number;
  facilities?: number;
  supportServices?: number;
  valueForMoney?: number;
  reviewTitle?: string;
  reviewText?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO university_ratings (
      id, university_id, student_email, student_application_id, overall_rating,
      teaching_quality, facilities, support_services, value_for_money, review_title, review_text, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.universityId,
    data.studentEmail,
    data.studentApplicationId || null,
    data.overallRating || null,
    data.teachingQuality || null,
    data.facilities || null,
    data.supportServices || null,
    data.valueForMoney || null,
    data.reviewTitle || null,
    data.reviewText || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getUniversityRatings(universityId?: string, isApproved?: boolean): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM university_ratings WHERE 1=1';
  const params: any[] = [];
  
  if (universityId) {
    query += ' AND university_id = ?';
    params.push(universityId);
  }
  if (isApproved !== undefined) {
    query += ' AND is_approved = ?';
    params.push(isApproved ? 1 : 0);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const stmt = db.prepare(query);
  if (params.length) stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

export function approveRating(id: string, approvedBy: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    UPDATE university_ratings SET is_approved = 1, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  stmt.bind([approvedBy, id]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function saveServiceFeedback(data: {
  id: string;
  studentEmail: string;
  feedbackType?: string;
  rating?: number;
  feedbackText?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT INTO service_feedback (
      id, student_email, feedback_type, rating, feedback_text, created_at
    ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.studentEmail,
    data.feedbackType || 'general',
    data.rating || null,
    data.feedbackText || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getServiceFeedback(isResolved?: boolean): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM service_feedback WHERE 1=1';
  const params: any[] = [];
  
  if (isResolved !== undefined) {
    query += ' AND is_resolved = ?';
    params.push(isResolved ? 1 : 0);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const stmt = db.prepare(query);
  if (params.length) stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

export function resolveFeedback(id: string, resolvedBy: string, notes?: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    UPDATE service_feedback SET is_resolved = 1, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, resolution_notes = ? WHERE id = ?
  `);
  stmt.bind([resolvedBy, notes || null, id]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

// ============================================
// EMAIL TEMPLATES FUNCTIONS
// ============================================

export function saveEmailTemplate(data: {
  id: string;
  name: string;
  subject: string;
  content: string;
  templateType?: string;
  variables?: string[];
  isActive?: boolean;
  createdBy?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO email_templates (
      id, name, subject, content, template_type, variables, is_active, created_by, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.name,
    data.subject,
    data.content,
    data.templateType || 'general',
    data.variables ? JSON.stringify(data.variables) : null,
    data.isActive !== false ? 1 : 0,
    data.createdBy || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getEmailTemplates(templateType?: string, isActive?: boolean): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM email_templates WHERE 1=1';
  const params: any[] = [];
  
  if (templateType) {
    query += ' AND template_type = ?';
    params.push(templateType);
  }
  if (isActive !== undefined) {
    query += ' AND is_active = ?';
    params.push(isActive ? 1 : 0);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const stmt = db.prepare(query);
  if (params.length) stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    const template = stmt.getAsObject();
    template.variables = JSON.parse(template.variables || '[]');
    results.push(template);
  }
  stmt.free();
  
  return results;
}

export function getEmailTemplateByName(name: string): any | null {
  if (!db) return null;
  
  const stmt = db.prepare('SELECT * FROM email_templates WHERE name = ? AND is_active = 1');
  stmt.bind([name]);
  
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
    result.variables = JSON.parse(result.variables || '[]');
  }
  stmt.free();
  
  return result;
}

export function deleteEmailTemplate(id: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare('DELETE FROM email_templates WHERE id = ?');
  stmt.bind([id]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

// ============================================
// WORKFLOW AUTOMATION FUNCTIONS
// ============================================

export function saveWorkflowRule(data: {
  id: string;
  name: string;
  description?: string;
  triggerType: string;
  triggerCondition: string;
  actionType: string;
  actionConfig?: Record<string, any>;
  isActive?: boolean;
  priority?: number;
  createdBy?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO workflow_rules (
      id, name, description, trigger_type, trigger_condition, action_type, action_config,
      is_active, priority, created_by, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.name,
    data.description || null,
    data.triggerType,
    data.triggerCondition,
    data.actionType,
    data.actionConfig ? JSON.stringify(data.actionConfig) : null,
    data.isActive !== false ? 1 : 0,
    data.priority || 1,
    data.createdBy || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getWorkflowRules(triggerType?: string, isActive?: boolean): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM workflow_rules WHERE 1=1';
  const params: any[] = [];
  
  if (triggerType) {
    query += ' AND trigger_type = ?';
    params.push(triggerType);
  }
  if (isActive !== undefined) {
    query += ' AND is_active = ?';
    params.push(isActive ? 1 : 0);
  }
  
  query += ' ORDER BY priority ASC, created_at DESC';
  
  const stmt = db.prepare(query);
  if (params.length) stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    const rule = stmt.getAsObject();
    rule.action_config = JSON.parse(rule.action_config || '{}');
    results.push(rule);
  }
  stmt.free();
  
  return results;
}

export function deleteWorkflowRule(id: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare('DELETE FROM workflow_rules WHERE id = ?');
  stmt.bind([id]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

// ============================================
// USER PREFERENCES FUNCTIONS
// ============================================

export function saveUserPreferences(data: {
  id: string;
  userEmail: string;
  language?: string;
  theme?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  timezone?: string;
  dateFormat?: string;
  preferencesData?: Record<string, any>;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO user_preferences (
      id, user_email, language, theme, email_notifications, sms_notifications, push_notifications,
      timezone, date_format, preferences_data, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.userEmail,
    data.language || 'vi',
    data.theme || 'light',
    data.emailNotifications !== false ? 1 : 0,
    data.smsNotifications ? 1 : 0,
    data.pushNotifications !== false ? 1 : 0,
    data.timezone || 'Asia/Ho_Chi_Minh',
    data.dateFormat || 'DD/MM/YYYY',
    data.preferencesData ? JSON.stringify(data.preferencesData) : null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getUserPreferences(userEmail: string): any | null {
  if (!db) return null;
  
  const stmt = db.prepare('SELECT * FROM user_preferences WHERE user_email = ?');
  stmt.bind([userEmail]);
  
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
    result.preferences_data = JSON.parse(result.preferences_data || '{}');
  }
  stmt.free();
  
  return result;
}

// ============================================
// TWO-FACTOR AUTHENTICATION FUNCTIONS
// ============================================

export function save2FASecret(data: {
  id: string;
  userEmail: string;
  secret: string;
  backupCodes?: string[];
  isEnabled?: boolean;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO user_2fa (
      id, user_email, secret, backup_codes, is_enabled, verified_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.userEmail,
    data.secret,
    data.backupCodes ? JSON.stringify(data.backupCodes) : null,
    data.isEnabled ? 1 : 0,
    data.isEnabled ? new Date().toISOString() : null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function get2FASettings(userEmail: string): any | null {
  if (!db) return null;
  
  const stmt = db.prepare('SELECT * FROM user_2fa WHERE user_email = ?');
  stmt.bind([userEmail]);
  
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
    result.backup_codes = JSON.parse(result.backup_codes || '[]');
  }
  stmt.free();
  
  return result;
}

export function enable2FA(userEmail: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    UPDATE user_2fa SET is_enabled = 1, verified_at = CURRENT_TIMESTAMP WHERE user_email = ?
  `);
  stmt.bind([userEmail]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function disable2FA(userEmail: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare('DELETE FROM user_2fa WHERE user_email = ?');
  stmt.bind([userEmail]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

// ============================================
// USER SESSIONS FUNCTIONS
// ============================================

export function saveUserSession(data: {
  id: string;
  userEmail: string;
  sessionToken: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  expiresAt: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT INTO user_sessions (
      id, user_email, session_token, ip_address, user_agent, device_info, expires_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.userEmail,
    data.sessionToken,
    data.ipAddress || null,
    data.userAgent || null,
    data.deviceInfo || null,
    data.expiresAt
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getUserSessions(userEmail: string): any[] {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    SELECT * FROM user_sessions 
    WHERE user_email = ? AND is_active = 1 AND expires_at > CURRENT_TIMESTAMP
    ORDER BY last_activity_at DESC
  `);
  stmt.bind([userEmail]);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

export function updateSessionActivity(sessionToken: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    UPDATE user_sessions SET last_activity_at = CURRENT_TIMESTAMP WHERE session_token = ?
  `);
  stmt.bind([sessionToken]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function invalidateSession(sessionToken: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare('UPDATE user_sessions SET is_active = 0 WHERE session_token = ?');
  stmt.bind([sessionToken]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function invalidateAllUserSessions(userEmail: string, exceptToken?: string): void {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'UPDATE user_sessions SET is_active = 0 WHERE user_email = ?';
  const params: any[] = [userEmail];
  
  if (exceptToken) {
    query += ' AND session_token != ?';
    params.push(exceptToken);
  }
  
  const stmt = db.prepare(query);
  stmt.bind(params);
  stmt.step();
  stmt.free();
  saveDatabase();
}

// ============================================
// BULK OPERATIONS FUNCTIONS
// ============================================

export function saveBulkOperation(data: {
  id: string;
  operationType: string;
  totalRecords?: number;
  inputData?: string;
  performedBy?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT INTO bulk_operations (
      id, operation_type, operation_status, total_records, input_data, performed_by, started_at
    ) VALUES (?, ?, 'pending', ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.operationType,
    data.totalRecords || null,
    data.inputData || null,
    data.performedBy || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function updateBulkOperationStatus(
  id: string,
  status: string,
  processed?: number,
  success?: number,
  failed?: number,
  resultData?: string,
  errorLog?: string
): void {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'UPDATE bulk_operations SET operation_status = ?';
  const params: any[] = [status];
  
  if (processed !== undefined) {
    query += ', processed_records = ?';
    params.push(processed);
  }
  if (success !== undefined) {
    query += ', success_records = ?';
    params.push(success);
  }
  if (failed !== undefined) {
    query += ', failed_records = ?';
    params.push(failed);
  }
  if (resultData !== undefined) {
    query += ', result_data = ?';
    params.push(resultData);
  }
  if (errorLog !== undefined) {
    query += ', error_log = ?';
    params.push(errorLog);
  }
  if (status === 'completed' || status === 'failed') {
    query += ', completed_at = CURRENT_TIMESTAMP';
  }
  
  query += ' WHERE id = ?';
  params.push(id);
  
  const stmt = db.prepare(query);
  stmt.bind(params);
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getBulkOperations(performedBy?: string, limit: number = 50): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM bulk_operations WHERE 1=1';
  const params: any[] = [];
  
  if (performedBy) {
    query += ' AND performed_by = ?';
    params.push(performedBy);
  }
  
  query += ' ORDER BY started_at DESC LIMIT ?';
  params.push(limit);
  
  const stmt = db.prepare(query);
  stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

// ============================================
// TRACKING CODE FUNCTIONS - SQLite Database
// ============================================

export function saveTrackingCodeToDb(data: {
  id: string;
  code: string;
  studentEmail: string;
  studentName: string;
  studentPhone: string;
  desiredUniversityId?: string;
  desiredUniversityName?: string;
  visaSystem: string;
  topikLevel?: string;
  ieltsScore?: string;
  initialTotalCostVnd?: number;
  status?: string;
  notes?: string;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO tracking_codes (
      id, code, student_email, student_name, student_phone,
      desired_university_id, desired_university_name, visa_system,
      topik_level, ielts_score, initial_total_cost_vnd, status, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.code,
    data.studentEmail,
    data.studentName,
    data.studentPhone,
    data.desiredUniversityId || null,
    data.desiredUniversityName || null,
    data.visaSystem,
    data.topikLevel || null,
    data.ieltsScore || null,
    data.initialTotalCostVnd || null,
    data.status || 'pending',
    data.notes || null
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getTrackingCodeFromDb(code: string): any | null {
  if (!db) return null;
  
  const stmt = db.prepare('SELECT * FROM tracking_codes WHERE code = ?');
  stmt.bind([code]);
  
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  
  return result;
}

export function getAllTrackingCodesFromDb(): any[] {
  if (!db) return [];
  
  const stmt = db.prepare('SELECT * FROM tracking_codes ORDER BY created_at DESC');
  const results: any[] = [];
  
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

export function searchTrackingCodesByEmailFromDb(email: string): any[] {
  if (!db) return [];
  
  const stmt = db.prepare(`
    SELECT * FROM tracking_codes 
    WHERE student_email LIKE ? 
    ORDER BY created_at DESC
  `);
  stmt.bind([`%${email}%`]);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

export function updateTrackingCodeStatusInDb(code: string, status: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    UPDATE tracking_codes 
    SET status = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE code = ?
  `);
  stmt.bind([status, code]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function deleteTrackingCodeFromDb(code: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare('DELETE FROM tracking_codes WHERE code = ?');
  stmt.bind([code]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

// ============================================
// SAVED FILTERS FUNCTIONS
// ============================================

export function saveFilter(data: {
  id: string;
  userEmail: string;
  filterName: string;
  filterType: string;
  filterCriteria: Record<string, any>;
  isDefault?: boolean;
}): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO saved_filters (
      id, user_email, filter_name, filter_type, filter_criteria, is_default, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.bind([
    data.id,
    data.userEmail,
    data.filterName,
    data.filterType,
    JSON.stringify(data.filterCriteria),
    data.isDefault ? 1 : 0
  ]);
  
  stmt.step();
  stmt.free();
  saveDatabase();
}

export function getSavedFilters(userEmail: string, filterType?: string): any[] {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM saved_filters WHERE user_email = ?';
  const params: any[] = [userEmail];
  
  if (filterType) {
    query += ' AND filter_type = ?';
    params.push(filterType);
  }
  
  query += ' ORDER BY is_default DESC, created_at DESC';
  
  const stmt = db.prepare(query);
  stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    const filter = stmt.getAsObject();
    filter.filter_criteria = JSON.parse(filter.filter_criteria || '{}');
    results.push(filter);
  }
  stmt.free();
  
  return results;
}

export function deleteSavedFilter(id: string): void {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare('DELETE FROM saved_filters WHERE id = ?');
  stmt.bind([id]);
  stmt.step();
  stmt.free();
  saveDatabase();
}

export default {
  initDatabase,
  saveDatabase,
  initializeSchema,
  getDatabase,
  runQuery,
  runExec,
  resetDatabase,
  exportDatabaseToFile,
  importDatabaseFromFile,
  // Progress
  saveStudentProgress,
  getStudentProgress,
  getAllStudentProgress,
  updateProgressStatus,
  // Documents
  saveDocument,
  getDocuments,
  verifyDocument,
  deleteDocument,
  // Payments
  savePayment,
  getPayments,
  updatePaymentStatus,
  // Notifications
  createNotification,
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  // Audit
  createAuditLog,
  getAuditLogs,
  // Applications
  saveStudentApplication,
  getStudentApplications,
  getAllApplications,
  updateApplicationStatus,
  // Calendar & Appointments
  saveAppointment,
  getAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  // Scholarships
  saveScholarship,
  getScholarships,
  deleteScholarship,
  saveScholarshipApplication,
  // Visa
  saveVisaApplication,
  getVisaApplications,
  // Reminders
  saveScheduledReminder,
  getScheduledReminders,
  markReminderAsSent,
  // Analytics
  saveAnalyticsMetric,
  getAnalyticsMetrics,
  // RBAC
  saveRole,
  getRoles,
  assignRoleToUser,
  getUserRoles,
  // Communication
  saveCommunicationLog,
  getCommunicationLogs,
  // Feedback
  saveUniversityRating,
  getUniversityRatings,
  approveRating,
  saveServiceFeedback,
  getServiceFeedback,
  resolveFeedback,
  // Email Templates
  saveEmailTemplate,
  getEmailTemplates,
  getEmailTemplateByName,
  deleteEmailTemplate,
  // Workflow Automation
  saveWorkflowRule,
  getWorkflowRules,
  deleteWorkflowRule,
  // User Preferences
  saveUserPreferences,
  getUserPreferences,
  // 2FA
  save2FASecret,
  get2FASettings,
  enable2FA,
  disable2FA,
  // Sessions
  saveUserSession,
  getUserSessions,
  updateSessionActivity,
  invalidateSession,
  invalidateAllUserSessions,
  // Bulk Operations
  saveBulkOperation,
  updateBulkOperationStatus,
  getBulkOperations,
  // Tracking Codes (SQLite)
  saveTrackingCodeToDb,
  getTrackingCodeFromDb,
  getAllTrackingCodesFromDb,
  searchTrackingCodesByEmailFromDb,
  updateTrackingCodeStatusInDb,
  deleteTrackingCodeFromDb,
  // Saved Filters
  saveFilter,
  getSavedFilters,
  deleteSavedFilter,
  // Legacy
  saveContactRequest,
  getContactRequests,
  saveRegistration,
  getRegistrations,
  updateRegistrationStatus,
  deleteRegistration,
  saveUser,
  getUserByEmail,
  getUserById,
  getAllUsers,
  deleteUser,
};
