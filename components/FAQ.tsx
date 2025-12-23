// FAQ Component
'use client';

import { useState } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'איך זה עובד?',
      answer: 'פשוט הזן את שם העסק או מספר החברה (ח.פ.), ואנחנו נבדוק את העסק מול רשם החברות, בתי משפט, הוצאה לפועל ובנק ישראל. תוך 3-5 שניות תקבל דוח מקיף עם ציון אמינות והמלצות.'
    },
    {
      question: 'מה כלול בדוח?',
      answer: 'הדוח כולל: סטטוס רישום העסק, פרטי בעלים, חובות בהוצל"פ, תיקים משפטיים, חשבונות בנק מוגבלים, סטטוס מע"מ, ציון אמינות (1-5 כוכבים), נקודות חוזק וסיכונים, והמלצות מותאמות אישית.'
    },
    {
      question: 'כמה זה עולה?',
      answer: 'הבדיקה הראשונה חינם (מידע בסיסי). דוח מלא עם כל הפרטים עולה ₪99. מנויים חודשיים זמינים החל מ-₪299/חודש ל-5 בדיקות.'
    },
    {
      question: 'האם הנתונים מדויקים?',
      answer: 'כן! אנחנו שואבים נתונים ישירות ממקורות ממשלתיים רשמיים: data.gov.il (רשם החברות), בנק ישראל, בתי משפט, והוצאה לפועל. הנתונים מעודכנים באופן שוטף.'
    },
    {
      question: 'כמה זמן לוקח לקבל דוח?',
      answer: '3-5 שניות בממוצע! אנחנו משתמשים בטכנולוגיית AI מתקדמת (Google Gemini 2.0 Flash) שמעבדת את הנתונים בזמן אמת.'
    },
    {
      question: 'האם המידע שלי מאובטח?',
      answer: 'בהחלט! אנחנו משתמשים בהצפנת SSL, לא שומרים היסטוריית חיפושים, ועומדים בתקן GDPR. כל הנתונים מועברים בצורה מוצפנת ולא נשמרים בשרתים שלנו.'
    },
    {
      question: 'אילו סוגי עסקים אפשר לבדוק?',
      answer: 'כל סוגי העסקים בישראל: חברות בע"מ, עוסק מורשה, עוסק פטור, שותפויות, עמותות, וחברות זרות הרשומות בישראל. המאגר שלנו כולל 716,714 עסקים.'
    },
    {
      question: 'מה אם לא מצאתי את העסק?',
      answer: 'אם העסק לא נמצא במאגר, יכול להיות שהוא: 1) עוסק פטור שלא חייב ברישום, 2) עסק חדש שעדיין לא עודכן במערכת, 3) עסק שנסגר. אנחנו נציג הודעה מתאימה עם המלצות.'
    },
    {
      question: 'האם יש אפליקציה?',
      answer: 'כרגע השירות זמין דרך האתר (desktop + mobile). אפליקציית iOS ו-Android בפיתוח ותשוחרר ב-Q2 2026.'
    },
    {
      question: 'איך אני משלם?',
      answer: 'אנחנו מקבלים כרטיסי אשראי, PayPal, ו-bit. התשלום מאובטח באמצעות Stripe (תקן PCI DSS Level 1).'
    }
  ];

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden transition-all hover:border-blue-300"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-right flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-400">
                  {openIndex === index ? '−' : '+'}
                </span>
                <span className="font-semibold text-gray-900 text-lg">
                  {faq.question}
                </span>
              </button>
              
              {openIndex === index && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700 text-right leading-relaxed" dir="rtl">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }