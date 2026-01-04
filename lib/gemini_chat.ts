/**
 * Gemini Chat API для интерактивного общения
 * Использует контекст проекта для ответов на вопросы
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  throw new Error('GOOGLE_API_KEY not configured');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Контекст проекта TrustCheck
const PROJECT_CONTEXT = `
אתה עוזר AI של פלטפורמת TrustCheck Israel.

## מידע על הפלטפורמה:

**TrustCheck Israel** - פלטפורמה B2C לבדיקת אמינות עסקים ישראלים.

**קהל יעד:** הורים הבודקים עסקים פרטיים (גני ילדים, מורים פרטיים) לפני תשלום.

**סוגי עסקים:**
- עוסק פטור (exempt business)
- עוסק מורשה (registered business)  
- חברות בע"מ (Israeli LLC)

**מקורות מידע:**
1. מטמון PostgreSQL (datasets מ-data.gov.il - 716K חברות)
2. סריקה בזמן אמת (ica.justice.gov.il, court.gov.il)
3. נתוני mock לפיתוח

**טכנולוגיה:**
- Next.js 14 (Frontend + API)
- PostgreSQL (Government data cache)
- Google Gemini 2.0 Flash (AI reports)
- Docker (Deployment)

**תכונות מרכזיות:**
- חיפוש לפי ח.פ. / טלפון / שם
- דוחות אמון מפורטים בעברית
- ציון אמון 1.0-5.0 כוכבים
- בדיקת תיקים משפטיים
- בדיקת הגבלות בנק ישראל
- בדיקת חובות מס

**איך זה עובד:**
1. משתמש מזין ח.פ. או שם עסק
2. המערכת שואבת נתונים מ-3 מקורות
3. Gemini מנתח את הנתונים
4. יוצר דוח אמון מפורט בעברית
5. משתמש מקבל המלצה (בטוח/זהירות/סיכון)

**עוזר בנושאים:**
- הסבר על הפלטפורמה
- איך לבדוק עסק
- הסבר על ציון האמון
- מקורות הנתונים
- שאלות טכניות
- תמיכה למשתמשים

תמיד עונה בעברית בצורה ברורה, ידידותית ומקצועית.
`;

export async function generateChatResponse(
  userPrompt: string,
  systemPrompt?: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
    });

    // Добавить system prompt к user prompt
    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\nשאלה: ${userPrompt}`
      : `${PROJECT_CONTEXT}\n\nשאלה: ${userPrompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    return text;

  } catch (error: unknown) {
    console.error('Gemini Chat Error:', error);

    // Обработка ошибок квоты
    if (error instanceof Error && error.message?.includes('quota')) {
      return 'מצטער, הגעתי למכסת השאילתות היומית. נסה שוב מאוחר יותר.';
    }

    // Обработка других ошибок
    if (error instanceof Error && error.message?.includes('API key')) {
      return 'שגיאה בהגדרות המערכת. צור קשר עם התמיכה.';
    }

    throw new Error('Failed to generate chat response');
  }
}

// Примеры FAQ для быстрых ответов
export const FAQ_RESPONSES: Record<string, string> = {
  'מה זה TrustCheck': `
TrustCheck Israel היא פלטפורמה לבדיקת אמינות עסקים ישראלים.

🎯 **למי זה מיועד?**
הורים שרוצים לבדוק גני ילדים, מורים פרטיים ועסקים קטנים לפני תשלום.

✅ **מה בודקים?**
- רישום רשמי (ח.פ., ע.מ.)
- תיקים משפטיים
- חובות מס
- הגבלות בנקאיות
- דוחות שנתיים

📊 **איך זה עובד?**
1. הזן ח.פ. או שם העסק
2. המערכת אוספת נתונים ממאגרים ממשלתיים
3. AI מנתח ומייצר דוח אמון
4. אתה מקבל המלצה: בטוח ✅ / זהירות ⚠️ / סיכון ❌
  `.trim(),

  'איך לבדוק': `
🔍 **3 דרכים לבדוק עסק:**

1️⃣ **לפי ח.פ. (9 ספרות)**
   הקלד: 515044532

2️⃣ **לפי טלפון**
   הקלד: 0523456789

3️⃣ **לפי שם**
   הקלד: "גן ילדים השרון"

➡️ **לחץ "בדוק עסק" וקבל דוח תוך 3 שניות**
  `.trim(),

  'ציון אמון': `
⭐ **מהו ציון האמון?**

המערכת מעניקה ציון 1.0-5.0 כוכבים:

🟢 **5.0-4.0 כוכבים - בטוח מאוד**
- אין תיקים משפטיים
- אין חובות
- רישום תקין

🟡 **3.9-3.0 כוכבים - זהירות**
- תיקים משפטיים קטנים
- אין הגבלות חמורות

🔴 **2.9-1.0 כוכבים - סיכון גבוה**
- תיקים משפטיים רבים
- חובות מס
- הגבלות בנקאיות

הציון מבוסס על ניתוח AI של כל הנתונים הרשמיים.
  `.trim(),
};
