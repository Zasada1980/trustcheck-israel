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
 * 
 * CRITICAL FIX: Now accepts optional businessName to preserve user input
 */
export function getMockBusinessData(query: string, businessName?: string): CheckIDBusinessData {
  // Определяем тип запроса
  const isHPNumber = /^\d{9}$/.test(query.trim());
  const hpNumber = isHPNumber ? query.trim() : generateRandomHP();
  
  // CRITICAL FIX: Pass businessName to preserve original user input
  const mockBusinesses = generateMockBusinessByHP(hpNumber, query, businessName);
  
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
 * 
 * CRITICAL FIX: Now accepts businessName parameter to use original user input as name
 */
function generateMockBusinessByHP(hpNumber: string, originalQuery: string, businessName?: string): CheckIDBusinessData {
  // Используем последние цифры HP для вариации данных
  const lastDigit = parseInt(hpNumber.slice(-1));
  const seed = parseInt(hpNumber.slice(-3));
  
  // Типы бизнесов
  type BusinessType = 'עוסק פטור' | 'עוסק מורשה' | 'חברה בע"מ' | 'שותפות רשומה';
  type BusinessStatus = 'active' | 'liquidation' | 'dissolved' | 'violating';
  
  // REMOVED: Mock business array deleted for production
  // System now relies on real data from PostgreSQL + government sources
  
  // Production mode: Return minimal placeholder data
  // Real data should come from PostgreSQL + government APIs
  const finalName = businessName && businessName.trim().length > 0
    ? businessName
    : (originalQuery !== hpNumber && originalQuery.length > 3 
      ? originalQuery 
      : `עסק ${hpNumber}`);
  
  return {
    name: finalName,
    registrationNumber: hpNumber,
    type: 'עוסק מורשה',
    status: 'active',
    foundedDate: '2020-01-01',
    industry: 'לא זמין',
    risks: ['מידע מוגבל - נדרש חיבור למקורות ממשלתיים'],
    strengths: [],
    address: {
      street: 'לא זמין',
      city: 'לא זמין',
      zipCode: '0000000',
    },
    owners: [],
    taxInfo: {
      hasVAT: false,
      vatNumber: undefined,
    },
    additionalInfo: `
⚠️ מידע חלקי זמין

לקבלת מידע מלא, המערכת זקוקה לחיבור למקורות הבאים:
• רשם החברות (רשות התאגידים)
• רשות המסים (עוסקים מורשים)
• משרד המשפטים (תיקים משפטיים)
• הוצאה לפועל (חובות)

נתונים אלו יהיו זמינים לאחר חיבור ל-API המתאים.
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
