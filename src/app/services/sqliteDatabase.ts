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

export default {
  initDatabase,
  saveDatabase,
  initializeSchema,
  getDatabase,
  runQuery,
  runExec,
  resetDatabase,
  exportDatabaseToFile,
  importDatabaseFromFile
};
