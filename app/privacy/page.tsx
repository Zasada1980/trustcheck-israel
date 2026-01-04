import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'מדיניות פרטיות | TrustCheck Israel',
  description: 'מדיניות הפרטיות של TrustCheck Israel - כיצד אנו אוספים, משתמשים ומגנים על המידע שלך',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-12" dir="rtl">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">מדיניות פרטיות</h1>
        <p className="text-gray-600 mb-8">עדכון אחרון: 28 בדצמבר 2025</p>

        <div className="prose prose-lg max-w-none space-y-8 text-gray-800">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. מבוא</h2>
            <p>
              TrustCheck Israel בע"מ ("אנחנו", "החברה") מחויבת להגנה על פרטיותך. 
              מדיניות זו מסבירה כיצד אנו אוספים, משתמשים, משתפים ומגנים על המידע האישי שלך.
            </p>
            <p className="mt-4">
              מדיניות זו חלה על כל השימושים בשירות TrustCheck Israel, כולל האתר, 
              API ושירותים נוספים.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. מידע שאנו אוספים</h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">2.1 מידע שאתה מספק</h3>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li><strong>הרשמה:</strong> שם מלא, כתובת אימייל, מספר טלפון (אופציונלי)</li>
              <li><strong>תשלומים:</strong> פרטי כרטיס אשראי (מעובדים באמצעות Tranzilla - אנו לא שומרים פרטי כרטיס)</li>
              <li><strong>בקשות בדיקה:</strong> שמות עסקים, מספרי ח.פ., מספרי טלפון שאתה מחפש</li>
              <li><strong>תמיכה:</strong> הודעות דוא"ל, תוכן פניות שירות</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">2.2 מידע שנאסף אוטומטית</h3>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li><strong>נתוני שימוש:</strong> עמודים שנצפו, זמן ביקור, היסטוריית חיפושים</li>
              <li><strong>מידע טכני:</strong> כתובת IP, סוג דפדפן, מערכת הפעלה, מכשיר</li>
              <li><strong>Cookies:</strong> קבצי Cookie לשיפור חוויית המשתמש (ראה מדיניות Cookies)</li>
              <li><strong>Google Analytics:</strong> נתונים אנונימיים על תעבורת אתר</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">2.3 מידע ממקורות חיצוניים</h3>
            <p>
              אנו אוספים מידע על <strong>עסקים</strong> (לא על אנשים פרטיים) ממקורות ציבוריים:
            </p>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li>רשם החברות במשרד המשפטים (data.gov.il)</li>
              <li>רשות המסים (סטטוס עוסק מורשה)</li>
              <li>נט המשפט (תיקים משפטיים ציבוריים)</li>
              <li>הוצאה לפועל (הליכים ציבוריים)</li>
              <li>בנק ישראל (רשימת חשבונות מוגבלים)</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. שימוש במידע</h2>
            <p>אנו משתמשים במידע שלך למטרות הבאות:</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">3.1 אספקת השירות</h3>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li>עיבוד בקשות בדיקת עסקים</li>
              <li>יצירת דוחות אמינות באמצעות AI (Google Gemini)</li>
              <li>שליחת דוחות בדוא"ל</li>
              <li>ניהול חשבון משתמש ומנוי</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">3.2 שיפור השירות</h3>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li>ניתוח דפוסי שימוש לשיפור ממשק המשתמש</li>
              <li>זיהוי ותיקון באגים</li>
              <li>פיתוח תכונות חדשות</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">3.3 תקשורת</h3>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li>שליחת אישורי רכישה וחשבוניות</li>
              <li>עדכונים על שינויים בשירות</li>
              <li>דיוור שיווקי (ניתן להסיר מנוי בכל עת)</li>
              <li>תמיכה טכנית</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">3.4 אבטחה ומניעת הונאות</h3>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li>זיהוי פעילות חשודה</li>
              <li>מניעת שימוש לרעה בשירות</li>
              <li>עמידה בדרישות חוקיות</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. שיתוף מידע עם צדדים שלישיים</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">4.1 ספקי שירות</h3>
            <p>אנו משתפים מידע עם:</p>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li><strong>Google Gemini AI:</strong> עיבוד דוחות (מידע אנונימי בלבד, ללא פרטי משתמשים)</li>
              <li><strong>Tranzilla:</strong> עיבוד תשלומים (פרטי כרטיס אשראי)</li>
              <li><strong>Hetzner Cloud:</strong> אירוח שרתים (גרמניה, תקן GDPR)</li>
              <li><strong>Google Analytics:</strong> ניתוח תעבורה (אנונימי)</li>
              <li><strong>Nodemailer/SendGrid:</strong> שליחת דוא"ל</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">4.2 דרישות חוקיות</h3>
            <p>
              נחשוף מידע אישי אם נדרש על פי חוק, צו שיפוטי, או בקשה ממשלתית לגיטימית.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">4.3 מה לא נעשה</h3>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li>❌ לא נמכור את המידע שלך לצדדים שלישיים</li>
              <li>❌ לא נשתף נתוני חיפוש עם משווקים</li>
              <li>❌ לא נשלח ספאם או דיוור ממפרסמים חיצוניים</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. אבטחת מידע</h2>
            <p>אנו נוקטים באמצעי אבטחה מתקדמים:</p>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li><strong>הצפנה:</strong> HTTPS/TLS 1.3 לכל התעבורה</li>
              <li><strong>מסדי נתונים:</strong> הצפנה ב-rest וב-transit</li>
              <li><strong>גישה:</strong> הרשאות מוגבלות למינימום עובדים נדרשים</li>
              <li><strong>גיבוי:</strong> גיבויים יומיים עם שמירה מוצפנת</li>
              <li><strong>ניטור:</strong> מערכות זיהוי חדירות 24/7</li>
            </ul>
            <p className="mt-4">
              <strong>שים לב:</strong> אף שיטת אבטחה אינה בטוחה ב-100%. אנו עושים כל שביכולתנו 
              להגן על המידע, אך לא נוכל להבטיח אבטחה מוחלטת.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. זכויותיך (GDPR)</h2>
            <p>בהתאם ל-GDPR ולחוקי הגנת הפרטיות הישראלים, זכויותיך כוללות:</p>

            <ul className="list-disc list-inside space-y-2 mr-6">
              <li><strong>גישה:</strong> לקבל עותק של כל המידע שלך</li>
              <li><strong>תיקון:</strong> לעדכן מידע לא מדויק</li>
              <li><strong>מחיקה:</strong> למחוק את חשבונך וכל המידע (למעט נתונים שנדרש לשמור על פי חוק)</li>
              <li><strong>ייצוא:</strong> לקבל את המידע בפורמט מובנה (JSON/CSV)</li>
              <li><strong>התנגדות:</strong> להתנגד לעיבוד מידע למטרות שיווקיות</li>
              <li><strong>הגבלה:</strong> להגביל עיבוד מידע מסוים</li>
            </ul>

            <p className="mt-4">
              <strong>מימוש זכויות:</strong> שלח בקשה ל-
              <a href="mailto:privacy@trustcheck.co.il" className="text-blue-600 hover:underline"> privacy@trustcheck.co.il</a>
              <br />
              נענה תוך 30 ימים.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. שמירת מידע</h2>
            <table className="min-w-full border-collapse border border-gray-300 mt-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-right">סוג מידע</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">תקופת שמירה</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">פרטי חשבון</td>
                  <td className="border border-gray-300 px-4 py-2">עד למחיקת חשבון + 7 שנים (דרישות מס)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">היסטוריית חיפושים</td>
                  <td className="border border-gray-300 px-4 py-2">90 ימים</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">דוחות שנרכשו</td>
                  <td className="border border-gray-300 px-4 py-2">5 שנים</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">נתוני תשלומים</td>
                  <td className="border border-gray-300 px-4 py-2">7 שנים (דרישות חוק)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Logs טכניים</td>
                  <td className="border border-gray-300 px-4 py-2">30 ימים</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies</h2>
            <p>
              אנו משתמשים ב-Cookies לשיפור השירות. לפרטים מלאים, ראה את 
              <a href="/cookies" className="text-blue-600 hover:underline"> מדיניות ה-Cookies</a>.
            </p>
            <p className="mt-2">
              סוגי Cookies: חיוניים (session), אנליטיקה (Google Analytics), העדפות משתמש.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. ילדים</h2>
            <p>
              השירות מיועד למבוגרים מעל גיל 18. איננו אוספים במודע מידע מילדים מתחת לגיל 18.
              אם הורה מגלה שילדו סיפק מידע, אנא פנה אלינו למחיקה מיידית.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. שינויים במדיניות</h2>
            <p>
              אנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יפורסמו באתר ובדוא"ל 
              לפחות 14 ימים לפני כניסתם לתוקף.
            </p>
            <p className="mt-2">
              <strong>תאריך עדכון אחרון מוצג בראש העמוד.</strong>
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. יצירת קשר</h2>
            <p>לשאלות או בקשות בנוגע לפרטיות:</p>
            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <p><strong>רכז הגנת המידע</strong></p>
              <p>TrustCheck Israel בע"מ</p>
              <p>דוא"ל: <a href="mailto:privacy@trustcheck.co.il" className="text-blue-600 hover:underline">privacy@trustcheck.co.il</a></p>
              <p>טלפון: <a href="tel:+972501234567" className="text-blue-600 hover:underline">050-123-4567</a></p>
              <p>כתובת: רחוב הרצל 123, תל אביב-יפו</p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
