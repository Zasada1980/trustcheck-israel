/**
 * Google Gemini AI Client
 * Генерация отчетов об амининости бизнеса с помощью Gemini 2.0 Flash
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { CheckIDBusinessData } from './checkid';

// Инициализация клиента
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

/**
 * Retry helper for Gemini API with exponential backoff
 */
async function retryGemini<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 2000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastRetry = i === retries - 1;
      
      // Check if it's a quota exceeded error (don't retry)
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          console.error('Gemini quota exceeded - stopping retries');
          throw error;
        }
      }
      
      if (isLastRetry) {
        throw error;
      }
      
      // Exponential backoff
      const backoffDelay = delay * Math.pow(2, i);
      console.log(`Gemini retry attempt ${i + 1}/${retries} after ${backoffDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  throw new Error('Retry failed');
}

/**
 * Генерация отчета о надежности бизнеса
 */
export async function generateBusinessReport(businessData: CheckIDBusinessData): Promise<string> {
  try {
    const result = await retryGemini(async () => {
      const model = genAI.getGenerativeModel({
        model: process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.0-flash',
      });

      const prompt = buildReportPrompt(businessData);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    }, 3, 2000); // 3 retries, 2s initial delay
    
    return result;
  } catch (error) {
    console.error('Gemini API error after retries:', error);
    
    // Log error details for monitoring
    if (error instanceof Error) {
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
    }
    
    // Fallback to mock data for development/testing
    console.warn('Using mock report data due to API error');
    return generateMockReport(businessData);
  }
}

/**
 * Построение промпта для отчета
 */
function buildReportPrompt(data: CheckIDBusinessData): string {
  // Format address if it's an object
  const addressStr = typeof data.address === 'object' 
    ? `${data.address.street}, ${data.address.city}${data.address.zipCode ? ', ' + data.address.zipCode : ''}`
    : data.address;
  
  // Format owners array
  const ownersStr = data.owners && data.owners.length > 0
    ? data.owners.map(o => `${o.name}${o.role ? ` (${o.role})` : ''}`).join(', ')
    : '';
  
  // NEW: Extract enhanced data from unified sources
  const hasRestrictedAccount = (data as any).bankingStatus?.hasRestrictedAccount;
  const isMaamRegistered = (data as any).taxStatus?.isMaamRegistered;
  const isMaamExempt = (data as any).taxStatus?.isMaamExempt;
  const activeLegalCases = (data as any).legalIssues?.activeCases || 0;
  const totalDebt = (data as any).legalIssues?.totalDebt || 0;
  const hasBankruptcy = (data as any).riskIndicators?.hasBankruptcyProceedings;
  
  // NEW: Classify business type by HP number (עוסק מורשה vs חברה בע"מ)
  const hpFirstDigit = data.registrationNumber?.toString().charAt(0);
  const isCompany = hpFirstDigit === '5';  // חברה בע"מ
  const isIndividualBusiness = hpFirstDigit && hpFirstDigit !== '5';  // עוסק מורשה/פטור
  
  // NEW: Tax certificates (ניהול ספרים + ניכוי מס במקור)
  const taxCertificates = (data as any).taxCertificates;
  const hasBookkeepingApproval = taxCertificates?.bookkeepingApproval?.hasApproval;
  const bookkeepingStatus = taxCertificates?.bookkeepingApproval?.status;
  const withholdingTaxIssues = taxCertificates ? 
    Object.values(taxCertificates.withholdingTax || {}).filter((status: any) => status === 'אין אישור').length : 0;
  
  // NEW: Bookkeeping risk assessment (if no direct data)
  const bookkeepingRisk = (data as any).bookkeepingRisk;
  const hasRiskAssessment = bookkeepingRisk && bookkeepingRisk.score > 0;
  
  return `
אתה מומחה לניתוח עסקים בישראל. צור דוח אמינות מקיף בעברית עבור העסק הבא:

**מידע בסיסי:**
שם העסק: ${data.name}
${data.registrationNumber ? `מספר רישום (ח.פ): ${data.registrationNumber}` : ''}
${data.type ? `סוג: ${data.type}` : ''}
${isCompany ? '🏢 **חברה בע"מ** (מספר מתחיל ב-5)' : isIndividualBusiness ? '👤 **עסק פרטי** (עוסק מורשה/פטור)' : ''}
${data.status ? `סטטוס רישום: ${data.status}` : ''}
${data.foundedDate ? `תאריך הקמה: ${data.foundedDate}` : ''}
${addressStr ? `כתובת: ${addressStr}` : ''}
${ownersStr ? `בעלים: ${ownersStr}` : ''}
${data.industry ? `תחום עיסוק: ${data.industry}` : ''}

**מידע משפטי ופיננסי (ממקורות ממשלתיים):**
${isIndividualBusiness && isMaamRegistered ? '✅ **עוסק מורשה במע"מ** - עסק רשום במס הכנסה, מדווח למס מע"מ' : ''}
${isIndividualBusiness && isMaamExempt ? '⚠️ **עוסק פטור** - עסק קטן, לא חייב במע"מ, פחות שקיפות פיננסית' : ''}
${isCompany && isMaamRegistered ? '✅ **רשום במע"מ** (חברה בע"מ עם דיווחי מס)' : ''}
${hasBookkeepingApproval !== undefined ? (hasBookkeepingApproval ? '✅ אישור ניהול ספרים תקין מרשות המיסים' : '❌ אין אישור ניהול ספרים (לא מנהל הנהלת חשבונות תקינה!)') : ''}
${withholdingTaxIssues > 0 ? `⚠️ אין אישור ניכוי מס במקור ב-${withholdingTaxIssues} קטגוריות` : ''}
${hasRiskAssessment ? `
⚠️ **ניתוח סיכון לאי קיום אישור ניהול ספרים** (על בסיס נתונים ממשלתיים):
   ציון סיכון: ${bookkeepingRisk.score}% (${bookkeepingRisk.level === 'critical' ? 'קריטי 🔴' : bookkeepingRisk.level === 'high' ? 'גבוה 🟠' : bookkeepingRisk.level === 'medium' ? 'בינוני 🟡' : 'נמוך 🟢'})
   רמת ודאות: ${bookkeepingRisk.confidence}%
   
   גורמי הסיכון שנמצאו:
   ${bookkeepingRisk.factors.map((f: any) => `- ${f.description} (השפעה: ${f.impact} נקודות)`).join('\n   ')}
   
   המלצה: ${bookkeepingRisk.recommendation}
   
   **חשוב:** זהו ניתוח הסתברות בלבד! בקש לראות אישור ניהול ספרים ממשי מהעסק.
` : ''}
${hasRestrictedAccount ? `🚨 חשבון בנק מוגבל (בנק ישראל) - 10+ שיקים חוזרים!` : '✅ אין חשבונות מוגבלים'}
${activeLegalCases > 0 ? `⚠️ ${activeLegalCases} תיקים משפטיים פעילים בבתי המשפט` : '✅ אין תיקים משפטיים פעילים'}
${totalDebt > 0 ? `⚠️ חובות בהוצאה לפועל: ₪${totalDebt.toLocaleString()}` : '✅ אין חובות בהוצאה לפועל'}
${hasBankruptcy ? `🚨 תיקי פשיטת רגל/פירוק פעילים!` : ''}
${data.risks && data.risks.length > 0 ? `סיכונים נוספים: ${data.risks.join('; ')}` : ''}
${data.strengths && data.strengths.length > 0 ? `נקודות חוזק: ${data.strengths.join('; ')}` : ''}

**הדוח צריך לכלול:**

1. **סיכום כללי** (2-3 משפטים):
   - האם העסק מומלץ או לא
   - רמת אמינות (1-5 כוכבים)
   - **חשוב:** אם יש חשבון בנק מוגבל או פשיטת רגל - ציון מקסימום 2 כוכבים!

2. **נקודות חוזק**:
   - מה טוב בעסק הזה (רישום תקין, אין חובות, וכו')
   ${isIndividualBusiness && isMaamRegistered ? '- **עוסק מורשה:** עסק רשום במע"מ = דיווחי מס תקינים, יותר שקיפות' : ''}

3. **נקודות חולשה/סיכונים**:
   - **אם יש חשבון בנק מוגבל:** הסבר שזה אומר 10+ שיקים חוזרים - סיכון מאוד גבוה!
   - **אם אין אישור ניהול ספרים:** הסבר שהעסק לא מנהל הנהלת חשבונות תקינה - פחות שקיפות, סיכון מס
   - **אם יש ציון סיכון גבוה (>70%):** הסבר שלפי ניתוח נתונים ממשלתיים - סבירות גבוהה לבעיות מס/רישום. ממליץ לבקש אישור ניהול ספרים במפורש!
   - **אם יש חובות הוצל"פ:** הסבר שהעסק לא משלם חובות - סיכון תשלום
   - **אם יש תיקים משפטיים:** הסבר מה זה אומר
   ${isIndividualBusiness && isMaamExempt ? '- **⚠️ עוסק פטור:** אין חובת דיווח למס הכנסה - פחות שקיפות פיננסית. עסק קטן (מחזור <100K ש"ח/שנה). **המלצה:** דרוש חשבונית ממילא!' : ''}
   - אזהרות אפשריות נוספות

4. **המלצות להורים**:
   - האם כדאי לשלם לעסק הזה מראש
   - על מה לשאול לפני תשלום
   ${isIndividualBusiness ? '- **עבור עוסק מורשה/פטור:** בקש תמיד חשבונית (גם אם פטור). בדוק ח.פ. בפועל (לא להסתפק בשם)' : ''}
   - איך להתגונן משרות/הונאות (למשל: דרוש חשבונית, חוזה בכתב, תשלום בהמחאות)

5. **סיכום סופי**:
   - המלצה ברורה: 
     * ✅ מומלץ (אם ציון 4-5)
     * ⚠️ בתנאים (אם ציון 3)
     * ❌ לא מומלץ (אם ציון 1-2)

**כללי חשובים:**
- פורמט התשובה בעברית בלבד
- ברור וקריא להורים שלא מבינים משפטים
- עם אייקונים/אמוג׳י לנראות טובה יותר (✅ ⚠️ ❌ 🚨 ⭐)
- עם ציון מספרי ברור (1-5 כוכבים)
- **אם יש חשבון בנק מוגבל או פשיטת רגל - חובה להזהיר בצורה חדה!**
- **אם עוסק פטור - הסבר שזה עסק קטן עם פחות שקיפות (אך לא בהכרח רע!)**

התחל את הדוח עכשיו:
`.trim();
}

/**
 * Анализ текста для извлечения ключевых фактов
 */
export async function extractKeyFacts(text: string): Promise<{
  trustScore: number;
  risks: string[];
  strengths: string[];
  recommendation: 'approved' | 'caution' | 'rejected';
}> {
  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.0-flash',
    });

    const prompt = `
נתח את הטקסט הבא והחזר JSON עם המידע:

טקסט:
${text}

החזר JSON בפורמט הזה בלבד (ללא markdown, רק JSON טהור):
{
  "trustScore": [מספר בין 1-5],
  "risks": ["סיכון 1", "סיכון 2"],
  "strengths": ["חוזקה 1", "חוזקה 2"],
  "recommendation": "approved/caution/rejected"
}
`.trim();

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Извлечение JSON из ответа
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Key facts extraction error:', error);
    // Fallback values
    return {
      trustScore: 3,
      risks: ['מידע לא מספיק'],
      strengths: ['מידע לא מספיק'],
      recommendation: 'caution',
    };
  }
}

/**
 * Проверка доступности Gemini API
 */
export async function checkGeminiHealth(): Promise<boolean> {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return false;
    }

    const model = genAI.getGenerativeModel({
      model: process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.0-flash',
    });

    const result = await model.generateContent('Test');
    const response = await result.response;
    
    return !!response.text();
  } catch (error) {
    console.error('Gemini health check failed:', error);
    return false;
  }
}

/**
 * Mock report generation for development/testing
 */
function generateMockReport(businessData: CheckIDBusinessData): string {
  const addressStr = typeof businessData.address === 'object'
    ? `${businessData.address.street}, ${businessData.address.city}`
    : businessData.address;
  
  const ownersStr = businessData.owners && businessData.owners.length > 0
    ? businessData.owners.map(o => o.name).join(', ')
    : 'לא צוין';
  
  return `
**דוח אמינות עסקית - ${businessData.name}**

**סיכום:**
זהו עסק ${businessData.type || 'עוסק מורשה'} בתחום ${businessData.industry || 'שונות'} הפועל בישראל. על פי הנתונים שנמצאו, העסק ${businessData.status === 'active' ? 'פעיל ותקין' : 'רשום במרשם'}.

**נקודות חוזק:**
${businessData.strengths && businessData.strengths.length > 0 ? businessData.strengths.map(s => `• ${s}`).join('\n') : '• העסק רשום רשמית\n• אין רישום בפנקס המוגבלים'}
${businessData.foundedDate ? `• פועל מאז ${businessData.foundedDate}` : ''}
${businessData.owners?.length ? `• בעלים ידועים: ${ownersStr}` : ''}

**סיכונים:**
${businessData.risks && businessData.risks.length > 0 ? businessData.risks.map(r => `• ${r}`).join('\n') : '• לא נמצאו דיווחים פיננסיים עדכניים\n• מידע מוגבל על רקע פיננסי'}

**פרטי העסק:**
• **כתובת**: ${addressStr || 'לא צוין'}
• **מספר רישום**: ${businessData.registrationNumber || 'לא ידוע'}
• **תחום עיסוק**: ${businessData.industry || 'לא צוין'}

**המלצות:**
בהתבסס על הנתונים הזמינים, רמת הסיכון הכללית היא **בינונית**. מומלץ:
1. לבקש המלצות מלקוחות קודמים
2. לשלם בתשלומים חלקיים במקום מראש
3. לבדוק ביקורות באינטרנט

**מסקנה:**
⭐⭐⭐ (3 מתוך 5 כוכבים)

המלצה: **ניתן לעבוד עם זהירות** - עסק לגיטימי אך מומלץ לנקוט אמצעי זהירות סטנדרטיים.

---
*דוח זה נוצר באמצעות Google Gemini AI (Mock Data) בתאריך ${new Date().toLocaleDateString('he-IL')}*
*מידע זה הוא להשוואה בלבד ואינו מהווה ייעוץ משפטי או פיננסי.*
`.trim();
}
