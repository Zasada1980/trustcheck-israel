import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'תנאי שימוש | TrustCheck Israel',
  description: 'תנאי השימוש והתקנון של פלטפורמת TrustCheck Israel לבדיקת אמינות עסקים',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-12" dir="rtl">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">תנאי שימוש</h1>
        <p className="text-gray-600 mb-8">עדכון אחרון: 28 בדצמבר 2025</p>

        <div className="prose prose-lg max-w-none space-y-8 text-gray-800">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. כללי</h2>
            <p>
              ברוכים הבאים ל-TrustCheck Israel ("השירות", "הפלטפורמה"). השירות מופעל על ידי 
              TrustCheck Israel בע"מ, ח.פ. 345033898 ("החברה", "אנחנו").
            </p>
            <p>
              השימוש בשירות מהווה הסכמה מלאה לתנאים אלה. אם אינך מסכים לתנאים, אנא הימנע משימוש בשירות.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. תיאור השירות</h2>
            <p>
              TrustCheck Israel מספקת שירות לבדיקת אמינות עסקים בישראל באמצעות איסוף וניתוח 
              מידע ממקורות ממשלתיים וציבוריים, כולל:
            </p>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li>רשם החברות במשרד המשפטים</li>
              <li>רשות המסים (סטטוס עוסק מורשה/פטור)</li>
              <li>נט המשפט (תיקים משפטיים)</li>
              <li>הוצאה לפועל</li>
              <li>בנק ישראל (חשבונות מוגבלים)</li>
            </ul>
            <p className="mt-4">
              השירות משתמש בבינת מלאכותית (Google Gemini AI) לניתוח המידע ומתן המלצות.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. סוגי חשבונות ומחירים</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">3.1 בדיקה חינמית</h3>
            <p>
              משתמשים חדשים זכאים לבדיקה ראשונה חינם עם גישה למידע בסיסי. הבדיקה תקפה ל-24 שעות.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">3.2 דוח מלא (₪29)</h3>
            <p>
              גישה מלאה לכל מקורות המידע, היסטוריה של 5 שנים, דוח PDF להורדה. 
              הדוח תקף ל-30 ימים עם עדכון אחד חינם.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">3.3 מנוי חודשי (₪99)</h3>
            <p>
              5 דוחות מלאים לחודש, עדכונים אוטומטיים, תמיכה עדיפות. תקופת ניסיון של 7 ימים.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. תשלומים והחזרים</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">4.1 אמצעי תשלום</h3>
            <p>
              תשלומים מעובדים באמצעות Tranzilla, שירות תשלומים מאובטח. אנו מקבלים כרטיסי אשראי ישראליים.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">4.2 מדיניות החזרים</h3>
            <p>
              בהתאם לחוק הגנת הצרכן התשמ"א-1981, זכאות להחזר כספי מלא תוך 7 ימים מרכישת דוח, 
              בתנאי שהדוח לא נצפה יותר מפעם אחת.
            </p>
            <p className="mt-2">
              מנויים חודשיים: ביטול עד 24 שעות לפני חידוש אוטומטי. ללא החזר כספי על תקופה שכבר שולמה.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. התחייבויות המשתמש</h2>
            <p>אתה מתחייב:</p>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li>לספק מידע נכון ומדויק בעת ההרשמה ובקשת דוחות</li>
              <li>לא לשתף את חשבונך עם אחרים</li>
              <li>לא להשתמש בשירות למטרות בלתי חוקיות</li>
              <li>לא לנסות לפרוץ או לפגוע במערכת</li>
              <li>לא למכור או להעביר מידע שהתקבל מהשירות לצדדים שלישיים ללא אישור</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. הגבלת אחריות</h2>
            <p>
              <strong>המידע המוצג בשירות נאסף ממקורות ציבוריים ואינו מהווה ייעוץ משפטי או פינסי.</strong>
            </p>
            <p className="mt-4">
              החברה אינה אחראית ל:
            </p>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li>דיוק המידע ממקורות חיצוניים (רשויות ממשלתיות)</li>
              <li>החלטות עסקיות שנעשו על סמך הדוחות</li>
              <li>נזקים ישירים או עקיפים כתוצאה משימוש בשירות</li>
              <li>הפסקות שירות זמניות לצורכי תחזוקה</li>
            </ul>
            <p className="mt-4">
              האחריות המקסימלית של החברה מוגבלת לסכום ששולם עבור הדוח הספציפי.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. קניין רוחני</h2>
            <p>
              כל הזכויות בשירות, לרבות עיצוב, לוגו, קוד מקור, ואלגוריתמי AI שייכות לחברה. 
              אסור להעתיק, לשכפל או להפיץ כל חלק מהשירות ללא אישור בכתב.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. שינויים בתנאי השימוש</h2>
            <p>
              החברה שומרת את הזכות לעדכן תנאים אלה בכל עת. שינויים מהוביים יפורסמו באתר 
              ויכנסו לתוקף תוך 7 ימים מהפרסום.
            </p>
            <p className="mt-2">
              המשך שימוש בשירות לאחר השינויים מהווה הסכמה לתנאים המעודכנים.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. סמכות שיפוט</h2>
            <p>
              תנאים אלה כפופים לחוקי מדינת ישראל. סמכות השיפוט הבלעדית נתונה לבתי המשפט 
              המוסמכים בתל אביב-יפו.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. יצירת קשר</h2>
            <p>לשאלות בנוגע לתנאי שימוש אלה, ניתן ליצור קשר:</p>
            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <p><strong>TrustCheck Israel בע"מ</strong></p>
              <p>ח.פ. 345033898</p>
              <p>דוא"ל: <a href="mailto:legal@trustcheck.co.il" className="text-blue-600 hover:underline">legal@trustcheck.co.il</a></p>
              <p>טלפון: <a href="tel:+972501234567" className="text-blue-600 hover:underline">050-123-4567</a></p>
            </div>
          </section>

          {/* Acceptance */}
          <section className="border-t-2 border-gray-300 pt-6 mt-8">
            <p className="text-sm text-gray-600">
              <strong>הסכמה:</strong> בשימוש בשירות TrustCheck Israel, אתה מצהיר כי קראת, הבנת והסכמת לתנאי שימוש אלה.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
