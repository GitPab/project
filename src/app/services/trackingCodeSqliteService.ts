import { initDatabase, runQuery, runExec, saveDatabase } from './sqliteDatabase';

export interface TrackingCodeRecord {
  id: string;
  code: string;
  student_email?: string;
  student_name?: string;
  student_phone?: string;
  desired_university_id?: string;
  desired_university_name?: string;
  visa_system?: string;
  topik_level?: string;
  ielts_score?: string;
  initial_total_cost_vnd?: number;
  status?: 'pending' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

function generateTrackingCode(): string {
  const prefix = 'STU';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function createTrackingCode(data: Partial<TrackingCodeRecord>): Promise<string> {
  await initDatabase();
  
  const code = data.code || generateTrackingCode();
  const id = data.id || crypto.randomUUID();
  
  runExec(`
    INSERT INTO tracking_codes (
      id, code, student_email, student_name, student_phone,
      desired_university_id, desired_university_name, visa_system,
      topik_level, ielts_score, initial_total_cost_vnd, status, notes
    ) VALUES (
      '${id}',
      '${code}',
      ${data.student_email ? `'${data.student_email.replace(/'/g, "''")}'` : 'NULL'},
      ${data.student_name ? `'${data.student_name.replace(/'/g, "''")}'` : 'NULL'},
      ${data.student_phone ? `'${data.student_phone}'` : 'NULL'},
      ${data.desired_university_id ? `'${data.desired_university_id}'` : 'NULL'},
      ${data.desired_university_name ? `'${data.desired_university_name.replace(/'/g, "''")}'` : 'NULL'},
      ${data.visa_system ? `'${data.visa_system}'` : 'NULL'},
      ${data.topik_level ? `'${data.topik_level}'` : 'NULL'},
      ${data.ielts_score ? `'${data.ielts_score}'` : 'NULL'},
      ${data.initial_total_cost_vnd || 'NULL'},
      '${data.status || 'pending'}',
      ${data.notes ? `'${data.notes.replace(/'/g, "''")}'` : 'NULL'}
    )
  `);
  
  saveDatabase();
  return code;
}

export async function getTrackingCode(code: string): Promise<TrackingCodeRecord | null> {
  await initDatabase();
  const results = runQuery('SELECT * FROM tracking_codes WHERE code = ?', [code]);
  return results.length > 0 ? results[0] : null;
}

export async function getAllTrackingCodes(): Promise<TrackingCodeRecord[]> {
  await initDatabase();
  return runQuery('SELECT * FROM tracking_codes ORDER BY created_at DESC');
}

export async function updateTrackingCode(code: string, data: Partial<TrackingCodeRecord>): Promise<void> {
  await initDatabase();
  
  const updates: string[] = [];
  
  if (data.student_email !== undefined) {
    updates.push(`student_email = ${data.student_email ? `'${data.student_email.replace(/'/g, "''")}'` : 'NULL'}`);
  }
  if (data.student_name !== undefined) {
    updates.push(`student_name = ${data.student_name ? `'${data.student_name.replace(/'/g, "''")}'` : 'NULL'}`);
  }
  if (data.student_phone !== undefined) {
    updates.push(`student_phone = ${data.student_phone ? `'${data.student_phone}'` : 'NULL'}`);
  }
  if (data.status !== undefined) {
    updates.push(`status = '${data.status}'`);
  }
  if (data.notes !== undefined) {
    updates.push(`notes = ${data.notes ? `'${data.notes.replace(/'/g, "''")}'` : 'NULL'}`);
  }
  if (data.initial_total_cost_vnd !== undefined) {
    updates.push(`initial_total_cost_vnd = ${data.initial_total_cost_vnd}`);
  }
  
  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    runExec(`
      UPDATE tracking_codes 
      SET ${updates.join(', ')}
      WHERE code = '${code}'
    `);
    saveDatabase();
  }
}

export async function deleteTrackingCode(code: string): Promise<void> {
  await initDatabase();
  runExec(`DELETE FROM tracking_codes WHERE code = '${code}'`);
  saveDatabase();
}

export async function getTrackingCodesByEmail(email: string): Promise<TrackingCodeRecord[]> {
  await initDatabase();
  return runQuery('SELECT * FROM tracking_codes WHERE student_email = ? ORDER BY created_at DESC', [email]);
}

export default {
  createTrackingCode,
  getTrackingCode,
  getAllTrackingCodes,
  updateTrackingCode,
  deleteTrackingCode,
  getTrackingCodesByEmail
};
