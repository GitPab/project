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
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function getAllUniversities(includeInactive = false): Promise<UniversityRecord[]> {
  await initDatabase();
  try {
    let whereClause = '';
    if (!includeInactive) {
      whereClause = 'WHERE is_active IS NULL OR is_active = 1';
    }
    const results = runQuery(`SELECT * FROM universities ${whereClause} ORDER BY name`);
    return results.map(row => ({
      ...row,
      korean_data: row.korean_data ? JSON.parse(row.korean_data) : undefined,
      is_active: row.is_active === null ? true : row.is_active === 1
    }));
  } catch (error: any) {
    // If is_active column is missing, try without the filter
    if (error.message?.includes('no such column: is_active')) {
      console.warn('is_active column missing, querying without filter...');
      const results = runQuery('SELECT * FROM universities ORDER BY name');
      return results.map(row => ({
        ...row,
        korean_data: row.korean_data ? JSON.parse(row.korean_data) : undefined,
        is_active: true // Default to active if column doesn't exist
      }));
    }
    throw error;
  }
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  includeInactive?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getAllUniversitiesPaginated(params: PaginationParams = {}): Promise<PaginatedResult<UniversityRecord>> {
  const { page = 1, limit = 20, search, includeInactive = false } = params;
  const offset = (page - 1) * limit;
  
  await initDatabase();
  
  // Build WHERE clause
  let whereClause = 'WHERE 1=1';
  const queryParams: any[] = [];
  
  if (!includeInactive) {
    whereClause += ' AND (is_active IS NULL OR is_active = 1)';
  }
  
  if (search) {
    whereClause += ' AND (name LIKE ? OR name_korean LIKE ?)';
    const term = `%${search}%`;
    queryParams.push(term, term);
  }
  
  // Get total count
  const countResults = runQuery(`SELECT COUNT(*) as total FROM universities ${whereClause}`, queryParams);
  const total = countResults[0]?.total || 0;
  
  // Get paginated data
  const dataParams = [...queryParams, limit, offset];
  const results = runQuery(
    `SELECT * FROM universities ${whereClause} ORDER BY name LIMIT ? OFFSET ?`,
    dataParams
  );
  
  return {
    data: results.map(row => ({
      ...row,
      korean_data: row.korean_data ? JSON.parse(row.korean_data) : undefined,
      is_active: row.is_active === null ? true : row.is_active === 1
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function softDeleteUniversity(id: string): Promise<void> {
  await initDatabase();
  runExec(`
    UPDATE universities 
    SET is_active = 0, updated_at = datetime('now') 
    WHERE id = '${id.replace(/'/g, "''")}'
  `);
  saveDatabase();
}

export async function restoreUniversity(id: string): Promise<void> {
  await initDatabase();
  runExec(`
    UPDATE universities 
    SET is_active = 1, updated_at = datetime('now') 
    WHERE id = '${id.replace(/'/g, "''")}'
  `);
  saveDatabase();
}

export async function getUniversityById(id: string): Promise<UniversityRecord | null> {
  await initDatabase();
  const results = runQuery('SELECT * FROM universities WHERE id = ?', [id]);
  if (results.length === 0) return null;
  
  const row = results[0];
  return {
    ...row,
    korean_data: row.korean_data ? JSON.parse(row.korean_data) : undefined,
    is_active: row.is_active === null ? true : row.is_active === 1
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

export async function searchUniversities(searchTerm: string, includeInactive = false): Promise<UniversityRecord[]> {
  await initDatabase();
  const term = `%${searchTerm}%`;
  let whereClause = 'WHERE (name LIKE ? OR name_korean LIKE ? OR region LIKE ?)';
  
  if (!includeInactive) {
    whereClause += ' AND (is_active IS NULL OR is_active = 1)';
  }
  
  const results = runQuery(
    `SELECT * FROM universities ${whereClause} ORDER BY name`,
    [term, term, term]
  );
  return results.map(row => ({
    ...row,
    korean_data: row.korean_data ? JSON.parse(row.korean_data) : undefined,
    is_active: row.is_active === null ? true : row.is_active === 1
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
  getAllUniversitiesPaginated,
  getUniversityById,
  getUniversitiesByTier,
  searchUniversities,
  saveUniversity,
  deleteUniversity,
  softDeleteUniversity,
  restoreUniversity,
  bulkInsertUniversities
};
