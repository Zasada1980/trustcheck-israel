/**
 * CheckID API Client
 * Интеграция с CheckID.co.il для получения данных о бизнесах в Израиле
 */

import axios, { AxiosError } from 'axios';

const CHECKID_API_URL = process.env.CHECKID_API_URL || 'https://api.checkid.co.il';
const CHECKID_API_KEY = process.env.CHECKID_API_KEY || '';

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastRetry = i === retries - 1;
      
      // Don't retry on client errors (4xx)
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status && status >= 400 && status < 500 && status !== 429) {
          throw error; // Client error, don't retry
        }
      }
      
      if (isLastRetry) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const backoffDelay = delay * Math.pow(2, i) + Math.random() * 1000;
      console.log(`Retry attempt ${i + 1}/${retries} after ${backoffDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  throw new Error('Retry failed');
}

/**
 * Интерфейс данных о бизнесе из CheckID
 */
export interface CheckIDBusinessData {
  name: string;
  registrationNumber: string;
  type: 'עוסק פטור' | 'עוסק מורשה' | 'חברה בע"מ' | 'שותפות רשומה';
  status: 'active' | 'inactive' | 'suspended' | 'liquidation' | 'dissolved' | 'violating';
  foundedDate?: string;
  industry?: string; // Added for mock data
  address?: {
    street: string;
    city: string;
    zipCode?: string;
  };
  owners?: {
    name: string;
    idNumber?: string;
    role?: string;
  }[];
  risks?: string[]; // Added for mock data
  strengths?: string[]; // Added for mock data
  taxInfo?: {
    hasVAT: boolean;
    vatNumber?: string;
  };
  additionalInfo?: string;
}

/**
 * Поиск бизнеса по названию или номеру регистрации
 */
export async function searchBusiness(query: string): Promise<CheckIDBusinessData | null> {
  // Phase 1: Use mock data if no real API key configured
  const hasRealApiKey = CHECKID_API_KEY && 
                        CHECKID_API_KEY.trim() !== '' && 
                        !CHECKID_API_KEY.includes('mock');
  
  if (!hasRealApiKey) {
    console.log('[CheckID] Using mock data (Phase 1 MVP - no real API key)');
    return getMockBusinessData(query);
  }

  try {
    // TODO: Реальная интеграция с CheckID API
    // Документация: https://checkid.co.il/api-docs
    
    const result = await retryWithBackoff(async () => {
      const response = await axios.get(`${CHECKID_API_URL}/search`, {
        params: { q: query },
        headers: {
          'Authorization': `Bearer ${CHECKID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 seconds
      });

      if (response.data && response.data.success) {
        return mapCheckIDResponse(response.data.business);
      }

      return null;
    }, 3, 1000); // 3 retries, 1s initial delay
    
    return result;
  } catch (error) {
    console.error('CheckID API error after retries:', error);
    
    // Log error type for monitoring
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Message:', error.message);
    }
    
    // Fallback to mock data on API error
    console.warn('[CheckID] Falling back to mock data due to API error');
    return getMockBusinessData(query);
  }
}

/**
 * Получение детальной информации о бизнесе по ID
 */
export async function getBusinessDetails(businessId: string): Promise<CheckIDBusinessData | null> {
  // Phase 1: Use mock data if no real API key configured
  const hasRealApiKey = CHECKID_API_KEY && 
                        CHECKID_API_KEY.trim() !== '' && 
                        !CHECKID_API_KEY.includes('mock');
  
  if (!hasRealApiKey) {
    console.log('[CheckID] Using mock data (Phase 1 MVP - no real API key)');
    return getMockBusinessData(businessId);
  }

  try {
    const response = await axios.get(`${CHECKID_API_URL}/business/${businessId}`, {
      headers: {
        'Authorization': `Bearer ${CHECKID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (response.data && response.data.success) {
      return mapCheckIDResponse(response.data.business);
    }

    return null;
  } catch (error) {
    console.error('CheckID API error:', error);
    console.warn('[CheckID] Falling back to mock data due to API error');
    return getMockBusinessData(businessId);
  }
}

/**
 * Маппинг ответа CheckID API в наш интерфейс
 */
function mapCheckIDResponse(data: any): CheckIDBusinessData {
  return {
    name: data.name || data.businessName || 'Unknown',
    registrationNumber: data.registrationNumber || data.id || '',
    type: data.type || 'עוסק מורשה',
    status: data.status || 'active',
    foundedDate: data.foundedDate || data.establishmentDate,
    address: data.address ? {
      street: data.address.street || '',
      city: data.address.city || '',
      zipCode: data.address.zipCode || data.address.postalCode,
    } : undefined,
    owners: data.owners?.map((owner: any) => ({
      name: owner.name || owner.fullName,
      idNumber: owner.idNumber || owner.id,
      role: owner.role || owner.position,
    })),
    taxInfo: {
      hasVAT: data.hasVAT || false,
      vatNumber: data.vatNumber,
    },
    additionalInfo: data.notes || data.description,
  };
}

/**
 * Mock данные для разработки (до интеграции с CheckID)
 * Генерирует реалистичные данные на основе query/HP number
 */
export function getMockBusinessData(query: string): CheckIDBusinessData {
  // Определяем тип запроса
  const isHPNumber = /^\d{9}$/.test(query.trim());
  const hpNumber = isHPNumber ? query.trim() : generateRandomHP();
  
  // Создаём реалистичные mock данные на основе HP number
  const mockBusinesses = generateMockBusinessByHP(hpNumber, query);
  
  return mockBusinesses;
}

/**
 * Генерация HP number (если не передан)
 */
function generateRandomHP(): string {
  return '515' + Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Генерация реалистичных mock данных по HP number
 */
function generateMockBusinessByHP(hpNumber: string, originalQuery: string): CheckIDBusinessData {
  // Используем последние цифры HP для вариации данных
  const lastDigit = parseInt(hpNumber.slice(-1));
  const seed = parseInt(hpNumber.slice(-3));
  
  // Типы бизнесов
  type BusinessType = 'עוסק פטור' | 'עוסק מורשה' | 'חברה בע"מ' | 'שותפות רשומה';
  type BusinessStatus = 'active' | 'liquidation' | 'dissolved' | 'violating';
  
  const businessTypes: Array<{
    name: string;
    type: BusinessType;
    industry: string;
    status: BusinessStatus;
    foundedDate: string;
    risks: string[];
    strengths: string[];
    owners: Array<{ name: string; idNumber: string; role: string }>;
  }> = [
    {
      name: 'גן ילדים "שמש"',
      type: 'עוסק פטור',
      industry: 'חינוך - גן ילדים פרטי',
      status: 'active',
      foundedDate: '2018-09-01',
      risks: ['עוסק פטור (לא רשום למע"מ)', 'בעלות פרטית - אחריות מוגבלת'],
      strengths: ['פעיל 6 שנים', 'רישיון תקף ממשרד החינוך', 'ביטוח אחריות מקצועית'],
      owners: [{ name: 'שרה כהן', idNumber: '123456789', role: 'בעלים ומנהלת' }],
    },
    {
      name: 'בית ספר פרטי "אופק"',
      type: 'חברה בע"מ',
      industry: 'חינוך - בית ספר יסודי',
      status: 'active',
      foundedDate: '2015-01-15',
      risks: [],
      strengths: ['פעיל 9 שנים', 'חברה רשומה', 'רישיון משרד החינוך', 'דוחות כספיים תקינים'],
      owners: [
        { name: 'דוד לוי', idNumber: '234567890', role: 'מנכ"ל ובעלים (60%)' },
        { name: 'רחל אברהם', idNumber: '345678901', role: 'שותפה (40%)' }
      ],
    },
    {
      name: 'קייטרינג "טעים ובריא" בע"מ',
      type: 'עוסק מורשה',
      industry: 'הסעדה - קייטרינג אירועים',
      status: 'active',
      foundedDate: '2019-06-10',
      risks: ['חברה צעירה (5 שנים)', 'תחום תחרותי'],
      strengths: ['רשום למע"מ', 'תעודת כשרות תקפה', 'רישיון משרד הבריאות'],
      owners: [{ name: 'משה מזרחי', idNumber: '456789012', role: 'בעלים' }],
    },
    {
      name: 'מכון כושר "פיטנס פלוס"',
      type: 'עוסק מורשה',
      industry: 'ספורט - מכון כושר',
      status: 'active',
      foundedDate: '2016-03-20',
      risks: ['תחום עם נטישה גבוהה של לקוחות'],
      strengths: ['פעיל 8 שנים', 'רשום למע"מ', 'ביטוח אחריות', '120+ חברים פעילים'],
      owners: [
        { name: 'יוסי שרון', idNumber: '567890123', role: 'בעלים (70%)' },
        { name: 'ענת ברק', idNumber: '678901234', role: 'שותפה (30%)' }
      ],
    },
    {
      name: 'מסעדת "בשרים פרימיום"',
      type: 'חברה בע"מ',
      industry: 'מסעדנות - מסעדת בשרים',
      status: 'active',
      foundedDate: '2020-11-01',
      risks: ['חברה צעירה (4 שנים)', 'COVID-19 השפיע על התחום'],
      strengths: ['תעודת כשרות מהדרין', 'רישיון משרד הבריאות', 'דירוג Google: 4.5/5'],
      owners: [{ name: 'אבי גולדשטיין', idNumber: '789012345', role: 'בעלים ושף ראשי' }],
    },
    {
      name: 'משרד עורכי דין "כהן ושות"',
      type: 'שותפות רשומה',
      industry: 'שירותים משפטיים',
      status: 'active',
      foundedDate: '2010-05-15',
      risks: [],
      strengths: ['פעיל 14 שנים', 'רישיון לשכת עורכי הדין', 'התמחות בדיני עבודה', 'ביטוח אחריות מקצועית'],
      owners: [
        { name: 'עו"ד יעקב כהן', idNumber: '890123456', role: 'שותף בכיר' },
        { name: 'עו"ד תמר לוין', idNumber: '901234567', role: 'שותפה' }
      ],
    },
    {
      name: 'חנות צעצועים "ארץ הפלאות"',
      type: 'עוסק מורשה',
      industry: 'קמעונאות - צעצועים',
      status: 'active',
      foundedDate: '2017-12-01',
      risks: ['תחרות מחנויות מקוונות', 'תחום עונתי (פיקים בחגים)'],
      strengths: ['פעיל 7 שנים', 'רשום למע"מ', 'חנות פיזית + אתר מכירות', 'מוצרים מאושרים תקן ישראלי'],
      owners: [{ name: 'נועה דהן', idNumber: '012345678', role: 'בעלים' }],
    },
    {
      name: 'חברת ניקיון "נקי ומבריק" בע"מ',
      type: 'חברה בע"מ',
      industry: 'שירותי ניקיון מסחרי',
      status: 'active',
      foundedDate: '2014-08-20',
      risks: ['עובדים זרים - צורך בניהול ויזות'],
      strengths: ['פעיל 10 שנים', 'חברה רשומה', '50+ עובדים קבועים', 'חוזים עם 20+ לקוחות עסקיים'],
      owners: [{ name: 'אלי ביטון', idNumber: '123450987', role: 'מנכ"ל ובעלים' }],
    },
    {
      name: 'סטודיו יוגה "שלווה"',
      type: 'עוסק פטור',
      industry: 'בריאות - יוגה ומדיטציה',
      status: 'active',
      foundedDate: '2021-02-10',
      risks: ['עוסק פטור (הכנסה מתחת לתקרה)', 'עסק חדש (3 שנים)', 'תלות במורה אחת'],
      strengths: ['מורה מוסמכת בינלאומית', 'ביטוח אחריות', 'דירוג Google: 4.8/5 (45 ביקורות)'],
      owners: [{ name: 'מיכל רוזנברג', idNumber: '234509876', role: 'בעלים ומורה' }],
    },
    {
      name: 'מוסך "אוטו סנטר" בע"מ',
      type: 'חברה בע"מ',
      industry: 'רכב - תיקונים ואחזקה',
      status: 'active',
      foundedDate: '2012-07-01',
      risks: ['מלאי גבוה (חלקי חילוף)', 'תלות ביבואני רכב'],
      strengths: ['פעיל 12 שנים', 'רישיון ממשרד התחבורה', 'מכונאים מוסמכים', 'אחריות על עבודות'],
      owners: [{ name: 'רפי עזרא', idNumber: '345609871', role: 'בעלים ומכונאי ראשי' }],
    },
  ];
  
  // Выбираем mock business на основе seed
  const selectedBusiness = businessTypes[seed % businessTypes.length];
  
  // Если передан query (не HP) - используем его как name
  const finalName = originalQuery !== hpNumber && originalQuery.length > 3 
    ? originalQuery 
    : selectedBusiness.name;
  
  return {
    name: finalName,
    registrationNumber: hpNumber,
    type: selectedBusiness.type,
    status: selectedBusiness.status,
    foundedDate: selectedBusiness.foundedDate,
    industry: selectedBusiness.industry, // Added: expose industry as separate field
    risks: selectedBusiness.risks, // Added: expose risks array
    strengths: selectedBusiness.strengths, // Added: expose strengths array
    address: {
      street: `רחוב הרצל ${10 + (seed % 90)}`,
      city: ['תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'רמת גן'][seed % 5],
      zipCode: `${6000000 + seed}`,
    },
    owners: selectedBusiness.owners,
    taxInfo: {
      hasVAT: selectedBusiness.type !== 'עוסק פטור',
      vatNumber: selectedBusiness.type !== 'עוסק פטור' ? hpNumber : undefined,
    },
    additionalInfo: `
תחום עיסוק: ${selectedBusiness.industry}

🔍 ממצאי בדיקה:
${selectedBusiness.strengths.map(s => `✅ ${s}`).join('\n')}

${selectedBusiness.risks.length > 0 ? `⚠️ נקודות לתשומת לב:\n${selectedBusiness.risks.map(r => `• ${r}`).join('\n')}` : ''}

📌 הערה: זהו נתון לדוגמה (Mock Data). 
לאחר חיבור ל-CheckID API יוצגו נתונים אמיתיים מרשם החברות, משרד המשפטים ובנק ישראל.
    `.trim(),
  };
}

/**
 * Проверка доступности CheckID API
 */
export async function checkCheckIDHealth(): Promise<boolean> {
  try {
    if (!CHECKID_API_KEY) {
      return false;
    }

    const response = await axios.get(`${CHECKID_API_URL}/health`, {
      headers: {
        'Authorization': `Bearer ${CHECKID_API_KEY}`,
      },
      timeout: 5000,
    });

    return response.status === 200;
  } catch (error) {
    console.error('CheckID health check failed:', error);
    return false;
  }
}

/**
 * Получение стоимости запроса (для отображения пользователю)
 */
export function getCheckIDPricing(): {
  free: boolean;
  costPerQuery: number;
  currency: string;
} {
  return {
    free: true, // Freemium model
    costPerQuery: 0, // ₪0 для базовых данных, ₪1.50 для расширенных
    currency: 'ILS',
  };
}
