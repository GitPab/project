import { University, OptionalAddon } from '../context/AppContext';
import detailsCsv from './university-details.csv?raw';

type TopTier = 'Top1' | 'Top2' | 'Top3';

type DetailRecord = {
  name: string;
  koreanName: string;
  address: string;
  ranking: string;
  majors: string[];
  admissionText: string;
  tuitionD41: number | null;
  tuitionD22: number | null;
  tuitionD23: number | null;
  scholarshipPercents: number[];
  ktxCost: number | null;
  jobsText: string;
  gpaD41: number | null;
  gpaD2: number | null;
};

const parseCsvRows = (raw: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    const next = raw[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(current);
      if (row.some(value => value.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
      current = '';
      continue;
    }

    if (!inQuotes && char === ',') {
      row.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    if (row.some(value => value.trim().length > 0)) {
      rows.push(row);
    }
  }

  return rows;
};

const parseMinNumber = (text: string): number | null => {
  if (!text) return null;
  const matches = text.match(/[0-9][0-9.,]*/g);
  if (!matches) return null;
  const values = matches
    .map(value => parseInt(value.replace(/[.,]/g, ''), 10))
    .filter(value => Number.isFinite(value) && value > 0);
  if (!values.length) return null;
  let minValue = Math.min(...values);
  if (/[0-9]\s*K\b/i.test(text)) minValue *= 1000;
  if (/triệu|trieu|million|\bM\b/i.test(text)) minValue *= 1000000;
  return minValue;
};

const parseTuition = (text: string): number | null => {
  const value = parseMinNumber(text);
  if (!value) return null;
  const isPerTerm = /kỳ|semester/i.test(text);
  return isPerTerm ? value * 2 : value;
};

const parseScholarshipPercents = (text: string): number[] => {
  if (!text) return [];
  const matches = text.match(/[0-9]{1,3}\s*%/g);
  if (!matches) return [];
  const values = matches
    .map(value => parseInt(value.replace('%', ''), 10))
    .filter(value => Number.isFinite(value) && value > 0);
  return Array.from(new Set(values));
};

const parseGpa = (text: string, key: 'D4-1' | 'D2'): number | null => {
  if (!text) return null;
  const specific = text.match(new RegExp(`${key}[^0-9]*GPA\\s*>=\\s*([0-9.]+)`, 'i'));
  if (specific?.[1]) return parseFloat(specific[1]);
  const generic = text.match(/GPA\\s*>=\\s*([0-9.]+)/i);
  if (generic?.[1]) return parseFloat(generic[1]);
  return null;
};

const stopWords = new Set([
  'university',
  'college',
  'institute',
  'of',
  'the',
  'national',
  'state',
  'korea',
  'korean',
  'dai',
  'hoc',
  'dh'
]);

const normalizeForMatch = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/\bpusan\b/g, 'busan')
    .replace(/\bkyung\b/g, 'gyeong')
    .replace(/\bkyong\b/g, 'gyeong')
    .replace(/\bkwang\b/g, 'gwang')
    .replace(/\byonsei\b/g, 'yeonsei')
    .replace(/\bewha\b/g, 'ehwa')
    .replace(/\bsungkyunkwan\b/g, 'seonggyungwan');
};

const tokenizeName = (name: string): string[] => {
  if (!name) return [];
  return normalizeForMatch(name)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
};

const simplifyName = (name: string): string => {
  return tokenizeName(name)
    .filter(token => !stopWords.has(token))
    .join('');
};

const similarityScore = (left: string[], right: string[]): number => {
  if (!left.length || !right.length) return 0;
  const leftSet = new Set(left);
  let overlap = 0;
  right.forEach(token => {
    if (leftSet.has(token)) overlap += 1;
  });
  return overlap / Math.max(left.length, right.length);
};

const findDetailRecord = (name: string, koreanName: string): DetailRecord | undefined => {
  const koreanKey = koreanName.trim();
  if (koreanKey && detailByKorean.has(koreanKey)) return detailByKorean.get(koreanKey);

  const simpleKey = simplifyName(name);
  if (simpleKey && detailBySimple.has(simpleKey)) return detailBySimple.get(simpleKey);

  const targetTokens = tokenizeName(name).filter(token => !stopWords.has(token));
  let best: { record: DetailRecord; score: number } | null = null;
  detailRecords.forEach((record) => {
    const recordTokens = tokenizeName(record.name).filter(token => !stopWords.has(token));
    const score = similarityScore(targetTokens, recordTokens);
    if (!best || score > best.score) {
      best = { record, score };
    }
  });

  if (best && (best as any).score >= 0.7) return (best as any).record;
  return undefined;
};

const parseDetailsCsv = (raw: string): DetailRecord[] => {
  const rows = parseCsvRows(raw.trim());
  if (rows.length <= 1) return [];
  const dataRows = rows.slice(1);
  return dataRows
    .map((row) => {
      const [
        name = '',
        koreanName = '',
        address = '',
        ranking = '',
        majorsText = '',
        admissionText = '',
        tuitionD41Text = '',
        tuitionD22Text = '',
        tuitionD23Text = '',
        scholarshipText = '',
        ktxText = '',
        jobsText = ''
      ] = row;

      const majors = majorsText.split(',').map(part => part.trim()).filter(Boolean);
      const gpaD41 = parseGpa(admissionText, 'D4-1');
      const gpaD2 = parseGpa(admissionText, 'D2');
      return {
        name: name.trim(),
        koreanName: koreanName.trim(),
        address: address.trim(),
        ranking: ranking.trim(),
        majors,
        admissionText,
        tuitionD41: parseTuition(tuitionD41Text),
        tuitionD22: parseTuition(tuitionD22Text),
        tuitionD23: parseTuition(tuitionD23Text),
        scholarshipPercents: parseScholarshipPercents(scholarshipText),
        ktxCost: parseMinNumber(ktxText),
        jobsText: jobsText.trim(),
        gpaD41,
        gpaD2
      };
    })
    .filter(record => record.name || record.koreanName);
};

const detailRecords = parseDetailsCsv(detailsCsv);
const detailByKorean = new Map<string, DetailRecord>();
const detailBySimple = new Map<string, DetailRecord>();
detailRecords.forEach((record) => {
  if (record.koreanName) detailByKorean.set(record.koreanName, record);
  if (record.name) detailBySimple.set(simplifyName(record.name), record);
});

const TOP1_CSV = `DANH SÁCH TRƯỜNG TOP 1 NĂM 2026,,,
STT,TÊN TRƯỜNG,TÊN TIẾNG HÀN,KHU VỰC
1,Konkuk University,건국대학교,Seoul
2,Konyang University,건양대학교,Daejeon / Nonsan
3,Kyungpook National University,경북대학교,Daegu
4,Kyungsung University,경성대학교,Busan
5,Kyung Hee University,경희대학교,Seoul / Gyeonggi
6,Keimyung University,계명대학교,Daegu
7,Korea University,고려대학교,Seoul
8,Duksung Women’s University,덕성여자대학교,Seoul
9,Dongguk University,동국대학교,Seoul
10,Pusan National University,부산대학교,Busan
11,Busan University of Foreign Studies (BUFS),부산외국어대학교,Busan
12,University of Seoul,서울시립대학교,Seoul
13,Seoul Theological University,서울신학대학교,Gyeonggi (Bucheon)
14,Sun Moon University,선문대학교,Chungnam (Asan)
15,Sungkyul University,성결대학교,Gyeonggi (Anyang)
16,Sungkyunkwan University,성균관대학교,Seoul / Gyeonggi
17,Sungshin Women’s University,성신여자대학교,Seoul
18,Sejong University,세종대학교,Seoul
19,Sookmyung Women’s University,숙명여자대학교,Seoul
20,Ajou University,아주대학교,Gyeonggi (Suwon)
21,Ulsan National Institute of Science and Technology (UNIST),울산과학기술원,Ulsan
22,Ewha Womans University,이화여자대학교,Seoul
23,Inha University,인하대학교,Incheon
24,Jeju National University,제주대학교,Jeju
25,Joongbu University,중부대학교,Chungnam / Gyeonggi
26,Chung-Ang University,중앙대학교,Seoul / Gyeonggi
27,Chungnam National University,충남대학교,Daejeon
28,Pohang University of Science and Technology (POSTECH),포항공과대학교,Gyeongbuk
29,Korea Aerospace University,한국항공대학교,Gyeonggi
30,Hansung University,한성대학교,Seoul
31,Hanyang University,한양대학교,Seoul / Gyeonggi
32,Hongik University,홍익대학교,Seoul / Sejong`;

const TOP2_CSV = `DANH SÁCH TRƯỜNG TOP 2 NĂM 2026,,,
STT,TÊN TRƯỜNG,TÊN TIẾNG HÀN,KHU VỰC
1,Gachon University,가천대학교,Gyeonggi (Seongnam)
2,Catholic University of Korea,가톨릭대학교,Gyeonggi (Bucheon)
3,Kangnam University,강남대학교,Gyeonggi (Yongin)
4,Gangseo University,강서대학교,Seoul
5,Kangwon National University,강원대학교,Gangwon (Chuncheon)
6,Kyonggi University,경기대학교,Gyeonggi (Suwon)
7,Kyungnam University,경남대학교,Gyeongnam (Changwon)
8,Kyungdong University,경동대학교,Gangwon
9,Kyungpook National University,경북대학교,Daegu
10,Gyeongsang National University,경상국립대학교,Gyeongnam (Jinju)
11,Kyungwoon University,경운대학교,Gyeongbuk (Gumi)
12,Kyungil University,경일대학교,Gyeongbuk (Gyeongsan)
13,Kosin University,고신대학교,Busan
14,Kwangwoon University,광운대학교,Seoul
15,Gwangju Institute of Science and Technology (GIST),광주과학기술원,Gwangju
16,Gwangju University,광주대학교,Gwangju
17,Gwangju Women’s University,광주여자대학교,Gwangju
18,Gangneung-Wonju National University,국립강릉원주대학교,Gangwon
19,Kongju National University,국립공주대학교,Chungnam (Gongju)
20,Korea National University of Transportation,국립한국교통대학교,Chungbuk (Chungju)
21,Mokpo National University,국립목포대학교,Jeonnam (Muan)
22,Kumoh National Institute of Technology,국립금오공과대학교,Gyeongbuk (Gumi)
23,Pukyong National University,국립부경대학교,Busan
24,Suncheon National University,국립순천대학교,Jeonnam (Suncheon)
25,Changwon National University,국립창원대학교,Gyeongnam (Changwon)
26,Korea National University of Education,한국교원대학교,Chungbuk (Cheongju)
27,Korea Maritime & Ocean University,국립한국해양대학교,Busan
28,Hanbat National University,국립한밭대학교,Daejeon
29,Kookmin University,국민대학교,Seoul
30,Gimcheon University,김천대학교,Gyeongbuk (Gimcheon)
31,Nazarene University,나사렛대학교,Chungnam (Cheonan)
32,University of Seoul,서울시립대학교,Seoul
33,Dankook University,단국대학교,Gyeonggi (Yongin)
34,Daegu Catholic University,대구가톨릭대학교,Gyeongbuk (Gyeongsan)
35,Daegu University,대구대학교,Gyeongbuk (Gyeongsan)
36,Daeshin University,대신대학교,Gyeongbuk
37,Daejeon University,대전대학교,Daejeon
38,Daejin University,대진대학교,Gyeonggi (Pocheon)
39,Dongduk Women’s University,동덕여자대학교,Seoul
40,Dongmyung University,동명대학교,Busan
41,Dongseo University,동서대학교,Busan
42,Dong-A University,동아대학교,Busan
43,Dongshin University,동신대학교,Jeonnam (Naju)
44,Myongji University,명지대학교,Seoul / Gyeonggi (Yongin)
45,Baekseok University,백석대학교,Chungnam (Cheonan)
46,Sahmyook University,삼육대학교,Seoul
47,Sangmyung University,상명대학교,Seoul
48,Sogang University,서강대학교,Seoul
49,Seokyeong University,서경대학교,Seoul
50,Seoul National University of Science & Technology,서울과학기술대학교,Seoul
51,Seoul Christian University,서울기독대학교,Seoul
52,Seoul National University,서울대학교,Seoul
53,University of Seoul,서울시립대학교,Seoul
54,Seoul Women’s University,서울여자대학교,Seoul
55,Sungkyunkwan University,성균관대학교,Seoul / Gyeonggi (Suwon)
56,Semyung University,세명대학교,Chungbuk (Jecheon)
57,Soonchunhyang University,순천향대학교,Chungnam (Asan)
58,Soongsil University,숭실대학교,Seoul
59,Silla University,신라대학교,Busan
60,Shinhan University,신한대학교,Gyeonggi (Uijeongbu)
61,Anyang University,안양대학교,Gyeonggi (Anyang)
62,Yonsei University,연세대학교,Seoul
63,Yonsei University (Mirae),연세대학교(미래캠퍼스),Gangwon (Wonju)
64,Yeungnam University,영남대학교,Gyeongbuk (Gyeongsan)
65,Youngsan University,영산대학교,Busan
66,Woosuk University,우석대학교,Jeonbuk (Wanju)
67,Woosong University,우송대학교,Daejeon
68,University of Ulsan,울산대학교,Ulsan
69,Wonkwang University,원광대학교,Jeonbuk (Iksan)
70,Woosong University,우송대학교,Daejeon
71,Eulji University,을지대학교,Daejeon / Gyeonggi
72,Inje University,인제대학교,Gyeongnam (Gimhae)
73,Incheon National University,인천대학교,Incheon
74,Chonnam National University,전남대학교,Gwangju
75,Jeonbuk National University,전북대학교,Jeonbuk (Jeonju)
76,Jeonju University,전주대학교,Jeonbuk (Jeonju)
77,Chosun University,조선대학교,Gwangju
78,Jungwon University,중원대학교,Chungbuk
79,CHA University,차의과학대학교,Gyeonggi (Seongnam)
80,Changshin University,창신대학교,Gyeongnam (Changwon)
81,Cheongju University,청주대학교,Chungbuk (Cheongju)
82,Chungbuk National University,충북대학교,Chungbuk (Cheongju)
83,Pyeongtaek University,평택대학교,Gyeonggi (Pyeongtaek)
84,KAIST ,한국과학기술원,Daejeon
85,Korea National University of Arts,한국예술종합학교,Seoul
86,Korea National Sport University,한국체육대학교,Seoul
87,Hankyong National University,한경국립대학교,Gyeonggi (Anseong)
88,Handong Global University,한동대학교,Gyeongbuk (Pohang)
89,Hallym University,한림대학교,Gangwon (Chuncheon)
90,Hansei University,한세대학교,Gyeonggi (Gunpo)
91,Hanyang University (ERICA),한양대학교(ERICA캠퍼스),Gyeonggi (Ansan)
92,Hoseo University,호서대학교,Chungnam (Asan)`;

const TOP3_CSV = `DANH SÁCH TRƯỜNG HẠN CHẾ VISA NĂM 2026,,,
STT,TÊN TRƯỜNG,TÊN TRƯỜNG TIẾNG HÀN,KHU VỰC
1,Geumgang University,금강대학교,Chungnam (Nonsan)
2,Suwon Catholic University,수원가톨릭대학교,Gyeonggi (Hwaseong)
3,Joong-Ang Sangha University,중앙승가대학교,Gyeonggi (Gimpo)
4,Hyupsung University,협성대학교,Gyeonggi (Hwaseong)
5,Daegu Haany University,대구한의대학교,Gyeongbuk (Gyeongsan)
6,Sangji University,상지대학교,Wonju
7,Howon University,호원대학교,Jeonbuk (Gunsan)
8,Busan Kyungsang College,부산경상대학교,Busan
9,Busan Arts College,부산예술대학교,Busan
10,Hanyeong University,한영대학교,Jeollanam
11,Mokpo Science College,목포과학대학교,Jeollanam`;

const placeholders = [
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=1400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1400&auto=format&fit=crop',
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const pickImage = (index: number) => placeholders[index % placeholders.length];

const defaultAddons = (): OptionalAddon[] => [
  { id: 'dorm-kr', name: 'KTX (Ký túc xá)', type: 'dorm-kr' as const, amountRange: { min: 120000, max: 220000 }, perMonth: true, selectable: true },
  { id: 'flight', name: 'Vé máy bay', type: 'flight' as const, amount: 15000000, selectable: true },
  { id: 'scholarship', name: 'Học bổng TOPIK', type: 'scholarship' as const, percentage: 30, selectable: true },
  { id: 'savings', name: 'Tài khoản tiết kiệm', type: 'savings' as const, amount: 10000000, selectable: true },
];

const buildUniversity = (
  name: string,
  koreanName: string,
  region: string,
  tier: TopTier,
  index: number
): University => {
  const slug = slugify(name);
  const heroImage = `${pickImage(index)}&sig=${index + 1}`;
  const topLabel = tier === 'Top3' ? 'Trường hạn chế visa' : `Trường ${tier.replace('Top', 'Top ')}`;
  const detail = findDetailRecord(name, koreanName);

  const scholarshipList = detail?.scholarshipPercents ?? [];
  const buildScholarships = () => scholarshipList.map((discount) => ({ discountPct: discount }));
  const buildKtxOptions = () => detail?.ktxCost ? [{ priceKRWPerKy: detail.ktxCost }] : [];
  const visaSystemsDetail: Record<string, any> = {};

  if (detail?.tuitionD41) {
    visaSystemsDetail['D4-1'] = {
      available: true,
      invoiceKRWPerYear: detail.tuitionD41,
      scholarships: buildScholarships(),
      ktxOptions: buildKtxOptions()
    };
  }
  if (detail?.tuitionD22) {
    visaSystemsDetail['D2-2'] = {
      available: true,
      invoiceKRWPerYear: detail.tuitionD22,
      scholarships: buildScholarships(),
      ktxOptions: buildKtxOptions()
    };
  }
  if (detail?.tuitionD23) {
    visaSystemsDetail['D2-3'] = {
      available: true,
      invoiceKRWPerYear: detail.tuitionD23,
      scholarships: buildScholarships(),
      ktxOptions: buildKtxOptions()
    };
  }

  const admission: Record<string, any> = {};
  if (detail?.gpaD41) {
    admission['D4-1'] = { gpaMin: detail.gpaD41 };
  }
  if (detail?.gpaD2) {
    admission['D2-2'] = { gpaMin: detail.gpaD2 };
    admission['D2-3'] = { gpaMin: detail.gpaD2 };
  }

  const university: University = {
    id: `kr-${slug}-${tier.toLowerCase()}`,
    name,
    koreanName,
    region,
    top_tier: tier,
    country: 'South Korea',
    countryCode: '🇰🇷',
    tagline: `${topLabel} - Danh sách 2026`,
    thumbnail: heroImage,
    heroImage,
    overview: `${name} thuộc nhóm ${topLabel}. Khu vực: ${region}. Dữ liệu từ danh sách CSV năm 2026.`,
    academicPrograms: [
      { icon: 'GraduationCap', title: 'Ngôn ngữ Hàn', description: 'Chương trình D4-1 & dự bị tiếng' },
      { icon: 'Cpu', title: 'Kỹ thuật & CNTT', description: 'Các ngành phổ biến cho du học sinh' },
    ],
    galleryImages: [heroImage],
    ranking: detail?.ranking || `${topLabel} 2026`,
    generalTuition: 0,
    visaFee: 0,
    accommodationFee: 0,
    insuranceFee: 0,
    additionalFees: [],
    systems: [
      { id: 'd4-1', code: 'D4-1', name: 'Chương trình tiếng Hàn', available: true, fees: [] },
      { id: 'd2-2', code: 'D2-2', name: 'Chương trình đại học', available: true, fees: [] },
      { id: 'd2-3', code: 'D2-3', name: 'Chương trình sau đại học', available: true, fees: [] }
    ],
    koreanData: {
      isKoreanUniversity: true,
      topTier: tier as 'Top1' | 'Top2' | 'Top3',
      address: detail?.address || region,
      topVisa: tier,
      koreanRanking: detail?.ranking || topLabel,
      visaSystems: [
        { visaType: 'D4-1', tuitionRange: { min: 0, max: 0 }, applicationFee: 0, baseYearlyFee: 0, description: 'Chương trình tiếng Hàn' },
        { visaType: 'D2-2', tuitionRange: { min: 0, max: 0 }, applicationFee: 0, baseYearlyFee: 0, description: 'Chương trình đại học' },
        { visaType: 'D2-3', tuitionRange: { min: 0, max: 0 }, applicationFee: 0, baseYearlyFee: 0, description: 'Chương trình sau đại học' },
      ],
      visaSystemsDetail: Object.keys(visaSystemsDetail).length > 0 ? visaSystemsDetail : undefined,
      languageCourse: { available: true, priceVND: 13000000 },
      studentSupport: ['Airport pickup', 'ARC support', 'SIM setup'],
      majors: detail?.majors?.length ? detail.majors : undefined,
      admission: Object.keys(admission).length > 0 ? admission : undefined,
      jobOpportunities: detail?.jobsText || undefined,
    },
    fixedCosts: [
      { type: 'Phí tư vấn', amount: 39000000, currency: 'VND', category: 'fixed', description: 'Tư vấn định hướng & xử lý hồ sơ' },
      { type: 'Phí apply', amount: 100000, currency: 'KRW', category: 'fixed', description: 'Lệ phí nộp hồ sơ' },
    ],
    optionalAddons: defaultAddons(),
    majors: detail?.majors?.length ? detail.majors : ['Engineering', 'Business', 'Korean Language'],
  };

  return university;
};

const parseCsv = (raw: string, tier: TopTier): University[] => {
  const lines = raw.trim().split(/\r?\n/).slice(2); // skip title + header
  const universities: University[] = [];

  lines.forEach((line, index) => {
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length < 4) return;
    const name = parts[1];
    const koreanName = parts[2];
    const region = parts[3];
    if (!name) return;
    universities.push(buildUniversity(name, koreanName, region, tier, index));
  });

  return universities;
};

const mergeById = (list: University[]): University[] => {
  const map = new Map<string, University>();
  list.forEach((uni) => {
    map.set(uni.id, { ...map.get(uni.id), ...uni });
  });
  return Array.from(map.values());
};

export const topUniversities: University[] = mergeById([
  ...parseCsv(TOP1_CSV, 'Top1'),
  ...parseCsv(TOP2_CSV, 'Top2'),
  ...parseCsv(TOP3_CSV, 'Top3'),
]);

export const topCsvParsers = {
  parseCsv,
  buildUniversity,
};
