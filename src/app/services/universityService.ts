import { initDatabase, runQuery, runExec, saveDatabase } from './sqliteDatabase';

export interface UniversityRecord {
  id: string;
  name: string;
  name_korean?: string;
  region?: string;
  top_tier?: 'Top1' | 'Top2' | 'Top3';
  ranking?: string;
  country?: string;
  country_code?: string;
  logo_url?: string;
  banner_url?: string;
  address?: string;
  website?: string;
  description?: string;
  korean_data?: string;
}

export async function getAllUniversities(): Promise<UniversityRecord[]> {
  await initDatabase();
  const results = runQuery('SELECT * FROM universities ORDER BY name');
  return results.map(row => ({
    ...row,
    korean_data: row.korean_data ? JSON.parse(row.korean_data) : undefined
  }));
}

export async function getUniversityById(id: string): Promise<UniversityRecord | null> {
  await initDatabase();
  const results = runQuery('SELECT * FROM universities WHERE id = ?', [id]);
  if (results.length === 0) return null;
  
  const row = results[0];
  return {
    ...row,
    korean_data: row.korean_data ? JSON.parse(row.korean_data) : undefined
  };
}

export async function getUniversitiesByTier(tier: 'Top1' | 'Top2' | 'Top3'): Promise<UniversityRecord[]> {
  await initDatabase();
  const results = runQuery('SELECT * FROM universities WHERE top_tier = ? ORDER BY name', [tier]);
  return results.map(row => ({
    ...row,
    korean_data: row.korean_data ? JSON.parse(row.korean_data) : undefined
  }));
}

export async function searchUniversities(searchTerm: string): Promise<UniversityRecord[]> {
  await initDatabase();
  const term = `%${searchTerm}%`;
  const results = runQuery(
    'SELECT * FROM universities WHERE name LIKE ? OR name_korean LIKE ? OR region LIKE ? ORDER BY name',
    [term, term, term]
  );
  return results.map(row => ({
    ...row,
    korean_data: row.korean_data ? JSON.parse(row.korean_data) : undefined
  }));
}

export async function saveUniversity(university: UniversityRecord): Promise<void> {
  await initDatabase();
  
  const koreanDataJson = university.korean_data ? JSON.stringify(university.korean_data) : null;
  
  const existing = runQuery('SELECT id FROM universities WHERE id = ?', [university.id]);
  
  if (existing.length > 0) {
    // Update
    runExec(`
      UPDATE universities SET
        name = '${university.name.replace(/'/g, "''")}',
        name_korean = ${university.name_korean ? `'${university.name_korean.replace(/'/g, "''")}'` : 'NULL'},
        region = ${university.region ? `'${university.region.replace(/'/g, "''")}'` : 'NULL'},
        top_tier = ${university.top_tier ? `'${university.top_tier}'` : 'NULL'},
        ranking = ${university.ranking ? `'${university.ranking}'` : 'NULL'},
        country = ${university.country ? `'${university.country}'` : 'NULL'},
        country_code = ${university.country_code ? `'${university.country_code}'` : 'NULL'},
        address = ${university.address ? `'${university.address.replace(/'/g, "''")}'` : 'NULL'},
        korean_data = ${koreanDataJson ? `'${koreanDataJson.replace(/'/g, "''")}'` : 'NULL'},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = '${university.id}'
    `);
  } else {
    // Insert
    runExec(`
      INSERT INTO universities (id, name, name_korean, region, top_tier, ranking, country, country_code, address, korean_data)
      VALUES (
        '${university.id}',
        '${university.name.replace(/'/g, "''")}',
        ${university.name_korean ? `'${university.name_korean.replace(/'/g, "''")}'` : 'NULL'},
        ${university.region ? `'${university.region.replace(/'/g, "''")}'` : 'NULL'},
        ${university.top_tier ? `'${university.top_tier}'` : 'NULL'},
        ${university.ranking ? `'${university.ranking}'` : 'NULL'},
        ${university.country ? `'${university.country}'` : 'NULL'},
        ${university.country_code ? `'${university.country_code}'` : 'NULL'},
        ${university.address ? `'${university.address.replace(/'/g, "''")}'` : 'NULL'},
        ${koreanDataJson ? `'${koreanDataJson.replace(/'/g, "''")}'` : 'NULL'}
      )
    `);
  }
  
  saveDatabase();
}

export async function deleteUniversity(id: string): Promise<void> {
  await initDatabase();
  runExec(`DELETE FROM universities WHERE id = '${id}'`);
  saveDatabase();
}

export async function bulkInsertUniversities(universities: UniversityRecord[]): Promise<void> {
  await initDatabase();
  
  for (const university of universities) {
    await saveUniversity(university);
  }
}

export default {
  getAllUniversities,
  getUniversityById,
  getUniversitiesByTier,
  searchUniversities,
  saveUniversity,
  deleteUniversity,
  bulkInsertUniversities
};
