/**
 * University Seeder
 * Import universities from korean-universities.ts to PostgreSQL
 */

import dotenv from 'dotenv';
dotenv.config();

import { getPool } from './dbAdapter.js';

// Universities data extracted from src/app/data/korean-universities.ts
const universities = [
  {
    name: 'ĐẠI HỌC AJOU (아주대학교)',
    korean_name: '아주대학교',
    region: 'Suwon, Gyeonggi-do',
    country: 'Hàn Quốc',
    ranking: 15,
    top_tier: 'Top 2',
    hero_image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600',
    thumbnail: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400',
    korean_data: JSON.stringify({
      isKoreanUniversity: true,
      address: '206 Woldeukeom-ro, Woncheon-dong, Yeongtong-gu, Suwon, Gyeonggi-do, South Korea',
      topVisa: 'Top 2',
      koreanRanking: '15/200 trường đại học tại Hàn Quốc',
      visaSystems: [
        { visaType: 'D4-1', tuitionPerTerm: 1450000, applicationFee: 100000, baseYearlyFee: 5800000, description: 'Chương trình tiếng Hàn', visaName: 'D4-1 (Tiếng Hàn)' },
        { visaType: 'D2-1', tuitionPerTerm: 1350000, tuitionRange: { min: 1200000, max: 1500000 }, applicationFee: 150000, description: 'Chương trình đại học', visaName: 'D2-1 (Đại học)' }
      ],
      fixedCosts: [
        { type: 'Phí tư vấn', amount: 39000000, currency: 'VND', category: 'fixed' },
        { type: 'Phí môi giới', amount: 11000000, currency: 'VND', category: 'fixed' },
        { type: 'Khóa học tiếng Hàn', amount: 13000000, currency: 'VND', category: 'fixed' },
        { type: 'Phí apply', amount: 100000, currency: 'KRW', category: 'fixed' },
        { type: 'Phí hóa đơn', amount: 5800000, currency: 'KRW', category: 'fixed' },
        { type: 'Tài khoản tiết kiệm', amount: 10000000, currency: 'KRW', category: 'fixed' }
      ]
    })
  },
  {
    name: 'ĐẠI HỌC KONKUK (건국대학교)',
    korean_name: '건국대학교',
    region: 'Seoul',
    country: 'Hàn Quốc',
    ranking: 25,
    top_tier: 'Top 2',
    hero_image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600',
    thumbnail: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400',
    korean_data: JSON.stringify({
      isKoreanUniversity: true,
      address: '120 Neungdong-ro, Gwangjin-gu, Seoul, South Korea',
      topVisa: 'Top 2',
      koreanRanking: '25/200 trường đại học tại Hàn Quốc',
      visaSystems: [
        { visaType: 'D4-1', tuitionPerTerm: 1400000, applicationFee: 100000, baseYearlyFee: 5500000, description: 'Chương trình tiếng Hàn', visaName: 'D4-1 (Tiếng Hàn)' },
        { visaType: 'D2-1', tuitionPerTerm: 1300000, tuitionRange: { min: 1100000, max: 1400000 }, applicationFee: 150000, description: 'Chương trình đại học', visaName: 'D2-1 (Đại học)' }
      ],
      fixedCosts: [
        { type: 'Phí tư vấn', amount: 39000000, currency: 'VND', category: 'fixed' },
        { type: 'Phí môi giới', amount: 11000000, currency: 'VND', category: 'fixed' },
        { type: 'Khóa học tiếng Hàn', amount: 13000000, currency: 'VND', category: 'fixed' },
        { type: 'Phí apply', amount: 100000, currency: 'KRW', category: 'fixed' },
        { type: 'Phí hóa đơn', amount: 5500000, currency: 'KRW', category: 'fixed' },
        { type: 'Tài khoản tiết kiệm', amount: 10000000, currency: 'KRW', category: 'fixed' }
      ]
    })
  },
  {
    name: 'ĐẠI HỌC KYUNG HEE (경희대학교)',
    korean_name: '경희대학교',
    region: 'Seoul',
    country: 'Hàn Quốc',
    ranking: 30,
    top_tier: 'Top 2',
    hero_image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600',
    thumbnail: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400',
    korean_data: JSON.stringify({
      isKoreanUniversity: true,
      address: '26 Kyungheedae-ro, Dongdaemun-gu, Seoul, South Korea',
      topVisa: 'Top 2',
      koreanRanking: '30/200 trường đại học tại Hàn Quốc',
      visaSystems: [
        { visaType: 'D4-1', tuitionPerTerm: 1500000, applicationFee: 100000, baseYearlyFee: 6000000, description: 'Chương trình tiếng Hàn', visaName: 'D4-1 (Tiếng Hàn)' },
        { visaType: 'D2-1', tuitionPerTerm: 1400000, tuitionRange: { min: 1200000, max: 1500000 }, applicationFee: 150000, description: 'Chương trình đại học', visaName: 'D2-1 (Đại học)' }
      ],
      fixedCosts: [
        { type: 'Phí tư vấn', amount: 39000000, currency: 'VND', category: 'fixed' },
        { type: 'Phí môi giới', amount: 11000000, currency: 'VND', category: 'fixed' },
        { type: 'Khóa học tiếng Hàn', amount: 13000000, currency: 'VND', category: 'fixed' },
        { type: 'Phí apply', amount: 100000, currency: 'KRW', category: 'fixed' },
        { type: 'Phí hóa đơn', amount: 6000000, currency: 'KRW', category: 'fixed' },
        { type: 'Tài khoản tiết kiệm', amount: 10000000, currency: 'KRW', category: 'fixed' }
      ]
    })
  }
];

async function seedUniversities() {
  console.log('🌱 Starting university seeder...');
  console.log('📊 Database URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
  
  try {
    const pool = await getPool();
    console.log('✅ Database pool connected');
    
    // Check if universities already exist
    const { rows: existing } = await pool.query('SELECT COUNT(*) as count FROM universities');
    const count = parseInt(existing[0].count);
    
    if (count > 0) {
      console.log(`⚠️  Database already has ${count} universities. Skipping seed.`);
      await pool.end();
      process.exit(0);
    }
    
    console.log(`📝 Inserting ${universities.length} universities...`);
    
    for (const uni of universities) {
      const { rows } = await pool.query(
        `INSERT INTO universities (id, name, korean_name, region, country, ranking, top_tier, 
                                  hero_image, thumbnail, korean_data, is_active, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
         RETURNING id, name`,
        [uni.name, uni.korean_name, uni.region, uni.country, uni.ranking, 
         uni.top_tier, uni.hero_image, uni.thumbnail, uni.korean_data]
      );
      
      console.log(`   ✅ ${rows[0].name} (ID: ${rows[0].id})`);
    }
    
    console.log(`\n🎉 Successfully seeded ${universities.length} universities!`);
    
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run immediately
seedUniversities();

