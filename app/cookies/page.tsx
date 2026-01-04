import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'מדיניות עוגיות | TrustCheck Israel',
  description: 'מדיניות השימוש ב-Cookies באתר TrustCheck Israel',
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-12" dir="rtl">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">מדיניות עוגיות (Cookies)</h1>
        <p className="text-gray-600 mb-8">עדכון אחרון: 28 בדצמבר 2025</p>

        <div className="prose prose-lg max-w-none space-y-8 text-gray-800">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. מה הן עוגיות (Cookies)?</h2>
            <p>
              עוגיות הן קבצי טקסט קטנים הנשמרים במכשיר שלך (מחשב, סמארטפון, טאבלט) 
              כאשר אתה מבקר באתר אינטרנט. הן מאפשרות לאתר "לזכור" אותך ואת ההעדפות שלך.
            </p>
            <p className="mt-4">
              TrustCheck Israel משתמש בעוגיות כדי לשפר את חוויית המשתמש ולהבטיח תפקוד תקין של השירות.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. סוגי עוגיות בשימוש</h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">2.1 עוגיות חיוניות (Essential Cookies)</h3>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="font-semibold">✅ נדרשות לתפקוד האתר - לא ניתן לסרב</p>
            </div>
            <table className="min-w-full border-collapse border border-gray-300 mt-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-right">שם Cookie</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">מטרה</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">תוקף</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"><code>session_id</code></td>
                  <td className="border border-gray-300 px-4 py-2">זיהוי המשתמש במהלך הביקור</td>
                  <td className="border border-gray-300 px-4 py-2">24 שעות</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"><code>auth_token</code></td>
                  <td className="border border-gray-300 px-4 py-2">אימות משתמש מחובר</td>
                  <td className="border border-gray-300 px-4 py-2">30 ימים</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"><code>csrf_token</code></td>
                  <td className="border border-gray-300 px-4 py-2">אבטחה נגד CSRF</td>
                  <td className="border border-gray-300 px-4 py-2">כל הגלישה</td>
                </tr>
              </tbody>
            </table>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2">2.2 עוגיות אנליטיות (Analytics Cookies)</h3>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
              <p className="font-semibold">⚠️ אופציונליות - ניתן לסרב</p>
            </div>
            <table className="min-w-full border-collapse border border-gray-300 mt-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-right">שם Cookie</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">ספק</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">מטרה</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">תוקף</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"><code>_ga</code></td>
                  <td className="border border-gray-300 px-4 py-2">Google Analytics</td>
                  <td className="border border-gray-300 px-4 py-2">זיהוי משתמשים יחודיים</td>
                  <td className="border border-gray-300 px-4 py-2">2 שנים</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"><code>_ga_*</code></td>
                  <td className="border border-gray-300 px-4 py-2">Google Analytics</td>
                  <td className="border border-gray-300 px-4 py-2">שמירת סטטוס Session</td>
                  <td className="border border-gray-300 px-4 py-2">2 שנים</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"><code>_gid</code></td>
                  <td className="border border-gray-300 px-4 py-2">Google Analytics</td>
                  <td className="border border-gray-300 px-4 py-2">זיהוי משתמשים</td>
                  <td className="border border-gray-300 px-4 py-2">24 שעות</td>
                </tr>
              </tbody>
            </table>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2">2.3 עוגיות העדפות (Preference Cookies)</h3>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
              <p className="font-semibold">⚠️ אופציונליות - ניתן לסרב</p>
            </div>
            <table className="min-w-full border-collapse border border-gray-300 mt-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-right">שם Cookie</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">מטרה</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">תוקף</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"><code>language</code></td>
                  <td className="border border-gray-300 px-4 py-2">שמירת העדפת שפה (עברית/אנגלית)</td>
                  <td className="border border-gray-300 px-4 py-2">1 שנה</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"><code>cookie_consent</code></td>
                  <td className="border border-gray-300 px-4 py-2">שמירת בחירת הסכמה ל-Cookies</td>
                  <td className="border border-gray-300 px-4 py-2">1 שנה</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. מטרות השימוש בעוגיות</h2>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li><strong>אימות:</strong> זיהוי משתמשים מחוברים לאורך הגלישה</li>
              <li><strong>אבטחה:</strong> הגנה מפני התקפות CSRF ופריצות</li>
              <li><strong>ניתוח שימוש:</strong> הבנת התנהגות משתמשים לשיפור השירות</li>
              <li><strong>העדפות:</strong> שמירת בחירות שפה וממשק</li>
              <li><strong>ביצועים:</strong> מדידת מהירות טעינה וזיהוי בעיות</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. עוגיות צד שלישי (Third-Party Cookies)</h2>
            <p>
              אנו משתמשים בשירותי צד שלישי שעשויים להציב עוגיות משלהם:
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mt-4 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Google Analytics</h4>
                <p className="text-sm text-gray-700">
                  שירות ניתוח תעבורה. נתונים מועברים ל-Google בארה"ב (תקן Privacy Shield).
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    מדיניות פרטיות Google
                  </a>
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Tranzilla</h4>
                <p className="text-sm text-gray-700">
                  עיבוד תשלומים. עוגיות נוספות רק בעמוד התשלום.
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <a href="https://www.tranzila.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    מדיניות פרטיות Tranzilla
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. כיצד לנהל עוגיות</h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">5.1 דרך הדפדפן</h3>
            <p>אתה יכול לחסום או למחוק עוגיות דרך הגדרות הדפדפן:</p>

            <div className="bg-gray-50 p-4 rounded-lg mt-4 space-y-2">
              <p><strong>Chrome:</strong> הגדרות → פרטיות ואבטחה → Cookies ונתוני אתרים</p>
              <p><strong>Firefox:</strong> הגדרות → פרטיות ואבטחה → Cookies ונתוני אתרים</p>
              <p><strong>Safari:</strong> העדפות → פרטיות → ניהול נתוני אתרים</p>
              <p><strong>Edge:</strong> הגדרות → Cookies והרשאות אתרים</p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
              <p className="font-semibold">⚠️ אזהרה:</p>
              <p className="text-sm">
                חסימת עוגיות חיוניות עלולה לגרום לתפקוד לקוי של האתר (למשל, אי יכולת להתחבר).
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2">5.2 ניהול Google Analytics</h3>
            <p>
              ניתן לחסום מעקב של Google Analytics באמצעות:
            </p>
            <ul className="list-disc list-inside space-y-2 mr-6 mt-2">
              <li>
                תוסף דפדפן: 
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mx-2">
                  Google Analytics Opt-out
                </a>
              </li>
              <li>הגדרות Do Not Track בדפדפן</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2">5.3 מרכז העדפות Cookies</h3>
            <div className="bg-blue-50 border-2 border-blue-500 p-6 rounded-lg mt-4">
              <p className="font-semibold text-blue-900 mb-3">נהל את העדפות ה-Cookies שלך:</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>עוגיות חיוניות</span>
                  <span className="bg-gray-400 text-white px-3 py-1 rounded text-sm">תמיד פעיל</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>עוגיות אנליטיקה</span>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                    מופעל
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>עוגיות העדפות</span>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                    מופעל
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-4">
                הגדרות אלו נשמרות ב-Cookie <code>cookie_consent</code> ותקפות ל-1 שנה.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. עוגיות במכשירים ניידים</h2>
            <p>
              באפליקציות ניידות (עתידיות), אנו משתמשים בטכנולוגיות מזהות דומות:
            </p>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li><strong>iOS:</strong> IDFA (Identifier for Advertisers) - ניתן לכיבוי בהגדרות</li>
              <li><strong>Android:</strong> Advertising ID - ניתן לאיפוס בהגדרות Google</li>
              <li><strong>Local Storage:</strong> שמירת העדפות מקומית במכשיר</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. שינויים במדיניות עוגיות</h2>
            <p>
              אנו עשויים לעדכן מדיניות זו מעת לעת. שינויים יפורסמו בעמוד זה עם תאריך עדכון חדש.
            </p>
            <p className="mt-2">
              שימוש מתמשך באתר לאחר שינויים מהווה הסכמה למדיניות המעודכנת.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. שאלות ויצירת קשר</h2>
            <p>לשאלות בנוגע לשימוש בעוגיות:</p>
            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <p><strong>TrustCheck Israel בע"מ</strong></p>
              <p>דוא"ל: <a href="mailto:privacy@trustcheck.co.il" className="text-blue-600 hover:underline">privacy@trustcheck.co.il</a></p>
              <p>טלפון: <a href="tel:+972501234567" className="text-blue-600 hover:underline">050-123-4567</a></p>
            </div>
          </section>

          {/* Footer Note */}
          <section className="border-t-2 border-gray-300 pt-6 mt-8">
            <p className="text-sm text-gray-600">
              <strong>קישורים נוספים:</strong>
              <br />
              <a href="/privacy" className="text-blue-600 hover:underline">מדיניות פרטיות</a> | 
              <a href="/terms" className="text-blue-600 hover:underline mx-2">תנאי שימוש</a> | 
              <a href="/disclaimer" className="text-blue-600 hover:underline">הצהרת אחריות</a>
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
