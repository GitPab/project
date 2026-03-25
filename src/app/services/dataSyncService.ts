import { initDatabase, runExec, runQuery, saveDatabase } from './sqliteDatabase';
import { topUniversities } from '../data/top-universities';

// Import CSV files
import top1Csv from '../data/Danh sách trường - Top 1.csv?raw';
import top2Csv from '../data/Danh sách trường - Top 2.csv?raw';
import top3Csv from '../data/Danh sách trường - Top 3.csv?raw';
import generalInfoCsv from '../data/Thông tin bóc giá trường Đại học Hàn Quốc - Thông tin chung.csv?raw';
import d41CostCsv from '../data/Thông tin bóc giá trường Đại học Hàn Quốc - Chi phí hệ D4-1.csv?raw';
import d22CostCsv from '../data/Thông tin bóc giá trường Đại học Hàn Quốc - Chi phí hệ D2-2.csv?raw';
import d23CostCsv from '../data/Thông tin bóc giá trường Đại học Hàn Quốc - Chi phí hệ D2-3.csv?raw';

export interface SyncResult {
  totalUniversities: number;
  inserted: number;
  updated: number;
  errors: string[];
}

export interface CsvUniversity {
  name: string;
  koreanName: string;
  region: string;
  topTier: 'Top1' | 'Top2' | 'Top3';
}

// Parse CSV lines
function parseCsv(csv: string): string[][] {
  const lines = csv.trim().split('\n');
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const next = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      
      if (!inQuotes && char === ',') {
        result.push(current.trim());
        current = '';
        continue;
      }
      
      current += char;
    }
    result.push(current.trim());
    return result;
  });
}

// Parse university list CSV
function parseUniversityList(csv: string, tier: 'Top1' | 'Top2' | 'Top3'): CsvUniversity[] {
  const rows = parseCsv(csv);
  const universities: CsvUniversity[] = [];
  
  // Skip header rows (first 2 rows usually contain title and column headers)
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (row.length >= 4 && row[1] && row[2]) {
      universities.push({
        name: row[1].replace(/"/g, '').trim(),
        koreanName: row[2].replace(/"/g, '').trim(),
        region: row[3]?.replace(/"/g, '').trim() || '',
        topTier: tier
      });
    }
  }
  
  return universities;
}

// Parse general info CSV (key-value format)
function parseGeneralInfo(csv: string): Record<string, string> {
  const rows = parseCsv(csv);
  const info: Record<string, string> = {};
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length >= 3 && row[1] && row[2]) {
      const key = row[1].trim();
      const value = row[2].replace(/"/g, '').trim();
      info[key] = value;
    }
  }
  
  return info;
}

// Parse cost breakdown CSV
function parseCostBreakdown(csv: string): Record<string, { cost: string; note: string }> {
  const rows = parseCsv(csv);
  const costs: Record<string, { cost: string; note: string }> = {};
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length >= 3 && row[1]) {
      const item = row[1].trim();
      const cost = row[2]?.trim() || '';
      const note = row[3]?.replace(/"/g, '').trim() || '';
      if (item) {
        costs[item] = { cost, note };
      }
    }
  }
  
  return costs;
}

// Generate ID from name
function generateId(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

// Find university in topUniversities or create new entry
function findOrCreateUniversity(csvUni: CsvUniversity): any {
  // Try to find matching university
  const existing = topUniversities.find(u => 
    u.name.toLowerCase().includes(csvUni.name.toLowerCase()) ||
    csvUni.name.toLowerCase().includes(u.name.toLowerCase()) ||
    (u.koreanName && u.koreanName === csvUni.koreanName)
  );
  
  if (existing) {
    return {
      ...existing,
      top_tier: csvUni.topTier,
      region: csvUni.region || existing.region,
      koreanName: csvUni.koreanName || existing.koreanName
    };
  }
  
  // Create new entry
  return {
    id: generateId(csvUni.name),
    name: csvUni.name,
    koreanName: csvUni.koreanName,
    country: 'Hàn Quốc',
    countryCode: '🇰🇷',
    region: csvUni.region,
    top_tier: csvUni.topTier,
    ranking: '',
    description: '',
    systems: [],
    koreanData: {
      isKoreanUniversity: true,
      topTier: csvUni.topTier,
      address: csvUni.region
    }
  };
}

export async function syncAllDataToDatabase(): Promise<SyncResult> {
  const result: SyncResult = {
    totalUniversities: 0,
    inserted: 0,
    updated: 0,
    errors: []
  };

  try {
    await initDatabase();
    
    // Parse all CSV data
    const top1Universities = parseUniversityList(top1Csv, 'Top1');
    const top2Universities = parseUniversityList(top2Csv, 'Top2');
    const top3Universities = parseUniversityList(top3Csv, 'Top3');
    
    const generalInfo = parseGeneralInfo(generalInfoCsv);
    const d41Costs = parseCostBreakdown(d41CostCsv);
    const d22Costs = parseCostBreakdown(d22CostCsv);
    const d23Costs = parseCostBreakdown(d23CostCsv);
    
    // Merge all universities
    const allCsvUniversities = [...top1Universities, ...top2Universities, ...top3Universities];
    
    // Remove duplicates (by name)
    const uniqueUniversities = new Map<string, CsvUniversity>();
    for (const uni of allCsvUniversities) {
      const key = uni.name.toLowerCase();
      if (!uniqueUniversities.has(key)) {
        uniqueUniversities.set(key, uni);
      }
    }
    
    result.totalUniversities = uniqueUniversities.size;
    
    // Process each university
    for (const csvUni of uniqueUniversities.values()) {
      try {
        const uniData = findOrCreateUniversity(csvUni);
        
        // Merge with general info if available
        const majorsText = generalInfo['Chuyên ngành'] || '';
        const majorCategories: Array<{ category: string; subjects: string[] }> = [];
        
        // Parse major categories from text
        if (majorsText.includes('Thế mạnh:')) {
          const strengthsMatch = majorsText.match(/Thế mạnh:\s*([^•\n]+)/i);
          if (strengthsMatch) {
            const subjects = strengthsMatch[1].split(/[,;]/).map(s => s.trim()).filter(Boolean);
            if (subjects.length > 0) {
              majorCategories.push({ category: 'Thế mạnh', subjects });
            }
          }
        }
        
        // Parse support policies as studentSupport array
        const supportText = generalInfo['Chính sách hỗ trợ'] || '';
        const studentSupport: string[] = supportText.split(/[•,;]/).map(s => s.trim()).filter(Boolean);
        
        // Parse scholarships
        const scholarshipText = generalInfo['Học bổng'] || '';
        const scholarships: Array<{ visaType: string; description: string }> = [];
        if (scholarshipText.includes('D4-1')) {
          scholarships.push({ visaType: 'D4-1', description: scholarshipText.split('•')[1]?.trim() || '' });
        }
        if (scholarshipText.includes('D2-2')) {
          scholarships.push({ visaType: 'D2-2', description: scholarshipText.split('•')[2]?.trim() || '' });
        }
        if (scholarshipText.includes('D2-3')) {
          scholarships.push({ visaType: 'D2-3', description: scholarshipText.split('•')[3]?.trim() || '' });
        }
        
        // Parse admission requirements
        const admissionText = generalInfo['Điều kiện tuyển sinh'] || '';
        const admissionRequirements: Array<{ visaType: string; requirement: string }> = [];
        if (admissionText.includes('D4-1')) {
          admissionRequirements.push({ visaType: 'D4-1', requirement: 'GPA ≥ 7.0, trống < 2 năm' });
        }
        if (admissionText.includes('D2-2') || admissionText.includes('D2-3')) {
          admissionRequirements.push({ visaType: 'D2', requirement: 'GPA ≥ 6.5, không giới hạn năm trống' });
        }
        
        // Parse financial requirements
        const financialText = generalInfo['Điều kiện tài chính'] || '';
        const financialRequirements: Array<{ visaType: string; requirement: string }> = [];
        if (financialText.includes('D4-1')) {
          financialRequirements.push({ visaType: 'D4-1', requirement: 'Sổ 10.000 USD lùi 6 tháng' });
        }
        if (financialText.includes('D2-2') || financialText.includes('D2-3')) {
          financialRequirements.push({ visaType: 'D2', requirement: 'Sổ 20.000.000 KRW lùi 3 tháng' });
        }
        
        // Parse dorm options from cost breakdown
        const dormOptions: Array<{ type: string; priceKRW: number }> = [];
        const ktxInfo = d41Costs['Kí túc xá tại Việt Nam'] || d41Costs['Invoice ký túc xá / Tiền thuê nhà'];
        if (ktxInfo?.note?.includes('Phòng 4')) {
          dormOptions.push({ type: 'Phòng 4 người', priceKRW: 747000 });
        }
        if (ktxInfo?.note?.includes('Phòng 2')) {
          dormOptions.push({ type: 'Phòng 2 người', priceKRW: 1102000 });
        }
        if (ktxInfo?.note?.includes('Quốc tế')) {
          dormOptions.push({ type: 'Phòng 2 người KTX Quốc tế', priceKRW: 1440000 });
        }
        
        const mergedKoreanData = {
          ...uniData.koreanData,
          isKoreanUniversity: true,
          topTier: csvUni.topTier,
          topVisa: generalInfo['Top Visa'] || csvUni.topTier,
          address: generalInfo['Địa chỉ'] || uniData.koreanData?.address,
          koreanRanking: generalInfo['Ranking'] || uniData.ranking,
          majors: majorsText.split(/[•,]/)?.map((m: string) => m.trim()).filter(Boolean) || uniData.koreanData?.majors || [],
          majorCategories: majorCategories.length > 0 ? majorCategories : uniData.koreanData?.majorCategories || [],
          studentSupport: studentSupport.length > 0 ? studentSupport : uniData.koreanData?.studentSupport || [],
          supportPolicies: studentSupport,
          scholarships: scholarships.length > 0 ? scholarships : uniData.koreanData?.scholarships || [],
          admissionRequirements: admissionRequirements.length > 0 ? admissionRequirements : uniData.koreanData?.admissionRequirements || [],
          financialRequirements: financialRequirements.length > 0 ? financialRequirements : uniData.koreanData?.financialRequirements || [],
          refundPolicy: generalInfo['Chính sách hoàn tiền'] || uniData.koreanData?.refundPolicy || '',
          dormOptions: dormOptions.length > 0 ? dormOptions : uniData.koreanData?.dormOptions || [],
          languageCourse: { available: true, priceVND: 13000000 },
          jobOpportunities: generalInfo['Việc làm thêm'] || '',
          workOpportunity: generalInfo['Việc làm thêm'] || '',
          visaSystems: generalInfo['Hệ tuyển sinh']?.split(/[,/]/)?.map((s: string) => s.trim()).filter(Boolean) || [],
          costBreakdown: {
            D41: d41Costs,
            D22: d22Costs,
            D23: d23Costs
          },
          systems: uniData.systems || []
        };
        
        // Check if university already exists in database
        const existing = runQuery('SELECT id FROM universities WHERE id = ?', [uniData.id]);
        
        const koreanDataJson = JSON.stringify(mergedKoreanData);
        
        if (existing.length > 0) {
          // Update existing
          runExec(`
            UPDATE universities SET
              name = '${uniData.name.replace(/'/g, "''")}',
              name_korean = ${uniData.koreanName ? `'${uniData.koreanName.replace(/'/g, "''")}'` : 'NULL'},
              region = ${uniData.region ? `'${uniData.region.replace(/'/g, "''")}'` : 'NULL'},
              top_tier = ${uniData.top_tier ? `'${uniData.top_tier}'` : 'NULL'},
              ranking = ${uniData.ranking ? `'${uniData.ranking.replace(/'/g, "''")}'` : 'NULL'},
              country = ${uniData.country ? `'${uniData.country.replace(/'/g, "''")}'` : 'NULL'},
              country_code = ${uniData.countryCode ? `'${uniData.countryCode}'` : 'NULL'},
              description = ${uniData.description ? `'${uniData.description.replace(/'/g, "''")}'` : 'NULL'},
              korean_data = '${koreanDataJson.replace(/'/g, "''")}',
              updated_at = CURRENT_TIMESTAMP
            WHERE id = '${uniData.id}'
          `);
          result.updated++;
        } else {
          // Insert new
          runExec(`
            INSERT INTO universities (
              id, name, name_korean, region, top_tier, ranking, country, country_code,
              description, korean_data
            ) VALUES (
              '${uniData.id}',
              '${uniData.name.replace(/'/g, "''")}',
              ${uniData.koreanName ? `'${uniData.koreanName.replace(/'/g, "''")}'` : 'NULL'},
              ${uniData.region ? `'${uniData.region.replace(/'/g, "''")}'` : 'NULL'},
              ${uniData.top_tier ? `'${uniData.top_tier}'` : 'NULL'},
              ${uniData.ranking ? `'${uniData.ranking.replace(/'/g, "''")}'` : 'NULL'},
              ${uniData.country ? `'${uniData.country.replace(/'/g, "''")}'` : 'NULL'},
              ${uniData.countryCode ? `'${uniData.countryCode}'` : 'NULL'},
              ${uniData.description ? `'${uniData.description.replace(/'/g, "''")}'` : 'NULL'},
              '${koreanDataJson.replace(/'/g, "''")}'
            )
          `);
          result.inserted++;
        }
      } catch (err: any) {
        result.errors.push(`Failed to sync ${csvUni.name}: ${err.message}`);
        console.error(`Failed to sync university ${csvUni.name}:`, err);
      }
    }
    
    // Also sync topUniversities data to ensure we have all the detailed information
    for (const uni of topUniversities) {
      try {
        const existing = runQuery('SELECT id FROM universities WHERE id = ?', [uni.id]);
        
        const koreanDataJson = JSON.stringify({
          isKoreanUniversity: uni.koreanData?.isKoreanUniversity || true,
          topTier: uni.top_tier || 'Top1',
          address: uni.koreanData?.address || '',
          koreanRanking: uni.koreanData?.koreanRanking || uni.ranking || '',
          majors: uni.koreanData?.majors || uni.majors || [],
          admission: uni.koreanData?.admission || {},
          visaSystemsDetail: uni.koreanData?.visaSystemsDetail || {},
          supportPolicies: uni.koreanData?.supportPolicies || [],
          refundPolicy: uni.koreanData?.refundPolicy || '',
          admissionsType: uni.koreanData?.admissionsType || '',
          commonFeesVND: uni.koreanData?.commonFeesVND || [],
          systems: uni.systems || []
        });

        if (existing.length === 0) {
          // Only insert if not already exists (from CSV sync)
          runExec(`
            INSERT INTO universities (
              id, name, name_korean, region, top_tier, ranking, country, country_code,
              description, korean_data
            ) VALUES (
              '${uni.id}',
              '${uni.name.replace(/'/g, "''")}',
              ${uni.koreanName ? `'${uni.koreanName.replace(/'/g, "''")}'` : 'NULL'},
              ${uni.region ? `'${uni.region.replace(/'/g, "''")}'` : 'NULL'},
              ${uni.top_tier ? `'${uni.top_tier}'` : 'NULL'},
              ${uni.ranking ? `'${uni.ranking}'` : 'NULL'},
              ${uni.country ? `'${uni.country}'` : 'NULL'},
              ${uni.countryCode ? `'${uni.countryCode}'` : 'NULL'},
              ${uni.description ? `'${uni.description.replace(/'/g, "''")}'` : 'NULL'},
              '${koreanDataJson.replace(/'/g, "''")}'
            )
          `);
          result.inserted++;
          result.totalUniversities++;
        }
      } catch (err: any) {
        result.errors.push(`Failed to sync ${uni.name}: ${err.message}`);
        console.error(`Failed to sync university ${uni.id}:`, err);
      }
    }
    
    saveDatabase();
    console.log('Full data sync complete:', result);
    return result;
    
  } catch (error: any) {
    result.errors.push(`Database initialization failed: ${error.message}`);
    return result;
  }
}

// Legacy function for backward compatibility
export async function syncUniversitiesToDatabase(): Promise<SyncResult> {
  return syncAllDataToDatabase();
}

export async function getDatabaseStats(): Promise<{
  totalUniversities: number;
  top1Count: number;
  top2Count: number;
  top3Count: number;
}> {
  await initDatabase();
  
  const total = runQuery('SELECT COUNT(*) as count FROM universities')[0]?.count || 0;
  const top1 = runQuery("SELECT COUNT(*) as count FROM universities WHERE top_tier = 'Top1'")[0]?.count || 0;
  const top2 = runQuery("SELECT COUNT(*) as count FROM universities WHERE top_tier = 'Top2'")[0]?.count || 0;
  const top3 = runQuery("SELECT COUNT(*) as count FROM universities WHERE top_tier = 'Top3'")[0]?.count || 0;
  
  return {
    totalUniversities: total,
    top1Count: top1,
    top2Count: top2,
    top3Count: top3
  };
}

export async function verifyDataIntegrity(): Promise<{
  valid: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  
  try {
    await initDatabase();
    
    // Check for universities with null names
    const nullNames = runQuery("SELECT id FROM universities WHERE name IS NULL OR name = ''");
    if (nullNames.length > 0) {
      issues.push(`${nullNames.length} universities have empty names`);
    }
    
    // Check for duplicate names
    const duplicates = runQuery(`
      SELECT name, COUNT(*) as count 
      FROM universities 
      GROUP BY name 
      HAVING count > 1
    `);
    if (duplicates.length > 0) {
      issues.push(`${duplicates.length} duplicate university names found`);
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
    
  } catch (error: any) {
    return {
      valid: false,
      issues: [`Verification failed: ${error.message}`]
    };
  }
}

export default {
  syncAllDataToDatabase,
  syncUniversitiesToDatabase,
  getDatabaseStats,
  verifyDataIntegrity
};
