import initSqlJs from 'sql.js';

let SQL: any = null;
let db: any = null;
let initPromise: Promise<any> | null = null;

const DB_STORAGE_KEY = 'sacma_sqlite_db';

export async function initDatabase(): Promise<any> {
  if (db) return db;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      console.log('Initializing SQL.js...');
      
      // Try to load local WASM file
      const wasmUrl = `${window.location.origin}/sql-wasm.wasm`;
      console.log('Fetching WASM from:', wasmUrl);
      
      const response = await fetch(wasmUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const wasmBinary = await response.arrayBuffer();
      console.log('WASM loaded, size:', wasmBinary.byteLength, 'bytes');
      
      // Initialize SQL.js with the binary
      SQL = await initSqlJs({
        wasmBinary: new Uint8Array(wasmBinary)
      });
      
      console.log('SQL.js initialized successfully');
      
      console.log('SQL.js loaded successfully');
      
      // Try to load existing database from localStorage
      const storedData = localStorage.getItem(DB_STORAGE_KEY);
      if (storedData) {
        console.log('Restoring database from localStorage...');
        const uint8Array = new Uint8Array(storedData.split(',').map(Number));
        db = new SQL.Database(uint8Array);
        console.log('Database restored, size:', uint8Array.length, 'bytes');
      } else {
        console.log('Creating new database...');
        db = new SQL.Database();
        await initializeSchema();
      }
      
      // Auto-save on page unload
      window.addEventListener('beforeunload', saveDatabase);
      
      return db;
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_universities_tier ON universities(top_tier)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tracking_code ON tracking_codes(code)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tracking_email ON tracking_codes(student_email)`);
  
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
