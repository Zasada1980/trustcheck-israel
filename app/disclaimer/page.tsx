import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'הצהרת אחריות | TrustCheck Israel',
  description: 'הצהרת אחריות ותנאי שימוש במידע מ-TrustCheck Israel',
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-12" dir="rtl">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">הצהרת אחריות</h1>
        <p className="text-gray-600 mb-8">עדכון אחרון: 28 בדצמבר 2025</p>

        <div className="prose prose-lg max-w-none space-y-8 text-gray-800">
          {/* Important Notice */}
          <div className="bg-red-50 border-2 border-red-500 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-red-900 mb-3">⚠️ הצהרה חשובה</h2>
            <p className="text-red-800 font-semibold">
              המידע המוצג ב-TrustCheck Israel נאסף ממקורות ציבוריים ואינו מהווה ייעוץ משפטי, 
              פיננסי או מקצועי. השימוש במידע הוא על אחריותך הבלעדית.
            </p>
          </div>

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. אופי השירות</h2>
            <p>
              TrustCheck Israel ("השירות") הוא כלי מידע המאגד נתונים ממקורות ציבוריים וממשלתיים 
              לצורך סקירה כללית של אמינות עסקים בישראל.
            </p>
            <p className="mt-4">
              <strong>השירות אינו:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li>❌ שירות בדיקת אשראי רשמי (כמו דן אנד ברדסטריט)</li>
              <li>❌ חוות דעת משפטית או החלטה שיפוטית</li>
              <li>❌ דוח רו"ח מוסמך</li>
              <li>❌ אישור רשמי לאמינות עסק</li>
              <li>❌ תחליף לבדיקה מקצועית מעמיקה</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. מקורות המידע ודיוק</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">2.1 מקורות ציבוריים</h3>
            <p>הנתונים נאספים מהמקורות הבאים:</p>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li><strong>רשם החברות:</strong> data.gov.il (עדכון: שנתי/רבעוני)</li>
              <li><strong>רשות המסים:</strong> סטטוס עוסק מורשה/פטור (עדכון: לא בזמן אמת)</li>
              <li><strong>נט המשפט:</strong> תיקים משפטיים ציבוריים (עדכון: יומי)</li>
              <li><strong>הוצאה לפועל:</strong> ica.justice.gov.il (עדכון: שבועי)</li>
              <li><strong>בנק ישראל:</strong> רשימת חשבונות מוגבלים (עדכון: חודשי)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">2.2 מגבלות דיוק</h3>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <p className="font-semibold">המידע עשוי להיות:</p>
              <ul className="list-disc list-inside space-y-1 mr-6 mt-2">
                <li>מיושן או לא עדכני</li>
                <li>חסר או לא שלם</li>
                <li>מכיל טעויות ממקור המידע המקורי</li>
                <li>לא משקף שינויים אחרונים (עד 90 ימים איחור)</li>
              </ul>
            </div>

            <p className="mt-4">
              <strong>אנו לא אחראים</strong> לדיוק, שלמות או עדכניות המידע ממקורות אלה.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. שימוש בבינה מלאכותית (AI)</h2>
            <p>
              הדוחות נוצרים באמצעות Google Gemini AI, שמנתח את הנתונים ומספק המלצות.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">3.1 מגבלות AI</h3>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li>AI עשוי לטעות בפרשנות נתונים מורכבים</li>
              <li>ההמלצות הן אוטומטיות ואינן מבוססות על שיקול דעת אנושי</li>
              <li>AI לא מבין הקשרים מקומיים או תרבותיים מיוחדים</li>
              <li>תוצאות AI עשויות להשתנות עבור אותם נתונים בזמנים שונים</li>
            </ul>

            <p className="mt-4">
              <strong>המלצות AI אינן תחליף לייעוץ מקצועי.</strong>
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. אין ייעוץ מקצועי</h2>
            
            <div className="bg-red-50 border-2 border-red-500 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-red-900 mb-3">השירות אינו מהווה:</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-red-900">❌ ייעוץ משפטי</h4>
                  <p className="text-sm text-red-800">
                    אל תסתמך על הדוח כראיה משפטית או כתחליף לייעוץ עורך דין.
                    לפני התקשרות חוזית, התייעץ עם עורך דין.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-red-900">❌ ייעוץ פיננסי</h4>
                  <p className="text-sm text-red-800">
                    אל תקבל החלטות השקעה או הלוואה רק על בסיס הדוח.
                    התייעץ עם יועץ פיננסי או רואה חשבון.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-red-900">❌ ייעוץ עסקי</h4>
                  <p className="text-sm text-red-800">
                    החלטות עסקיות דורשות בדיקות נוספות (Due Diligence מקיף).
                    הדוח הוא נקודת התחלה בלבד.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-red-900">❌ החלטה מחייבת</h4>
                  <p className="text-sm text-red-800">
                    המלצת "לא מומלץ" אינה פסילה משפטית. המלצת "מומלץ" אינה ערובה.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. הגבלת אחריות</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">5.1 אחריות כללית</h3>
            <p>
              TrustCheck Israel בע"מ, עובדיה, שותפיה וספקיה <strong>אינם אחראים</strong> ל:
            </p>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li>החלטות שקיבלת על בסיס המידע בשירות</li>
              <li>נזקים ישירים או עקיפים כתוצאה משימוש בשירות</li>
              <li>הפסד רווחים או הזדמנויות עסקיות</li>
              <li>מידע שגוי או מטעה ממקורות חיצוניים</li>
              <li>כשלים טכניים או הפסקות שירות</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">5.2 אחריות מקסימלית</h3>
            <p>
              במקרה של תביעה כלשהי, האחריות המקסימלית של החברה מוגבלת ל-<strong>סכום ששולם 
              עבור הדוח הספציפי</strong> (₪29-₪99 מקסימום).
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">5.3 זמן תביעה</h3>
            <p>
              כל תביעה חייבת להיות מוגשת תוך <strong>30 ימים</strong> מרכישת הדוח או 
              מגילוי הנזק (המוקדם מביניהם).
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. שימוש נכון במידע</h2>
            
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <h3 className="font-semibold text-green-900 mb-2">✅ שימושים מומלצים:</h3>
              <ul className="list-disc list-inside space-y-1 mr-6">
                <li>בדיקה ראשונית לפני פגישה עם עסק</li>
                <li>זיהוי סימני אזהרה בולטים</li>
                <li>משלים לבדיקות מקצועיות נוספות</li>
                <li>הערכה כללית של סיכונים</li>
              </ul>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
              <h3 className="font-semibold text-red-900 mb-2">❌ שימושים לא מומלצים:</h3>
              <ul className="list-disc list-inside space-y-1 mr-6">
                <li>כראיה בבית משפט ללא אישור שופט</li>
                <li>כתחליף לבדיקת Due Diligence מקיפה</li>
                <li>כבסיס יחיד להחלטת השקעה גדולה</li>
                <li>לפגיעה במוניטין עסק ללא בדיקות נוספות</li>
              </ul>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. הפסקות שירות</h2>
            <p>
              השירות עשוי להיות מופסק זמנית או לצמיתות בכל עת, ללא הודעה מוקדמת, עקב:
            </p>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li>תחזוקה מתוכננת או חירום</li>
              <li>כשלים טכניים או תקלות מערכת</li>
              <li>שינויים במקורות מידע חיצוניים (סגירת API ממשלתי)</li>
              <li>החלטות עסקיות או רגולטוריות</li>
            </ul>
            <p className="mt-4">
              <strong>אין החזר כספי</strong> בגין הפסקות שירות זמניות (עד 7 ימים).
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. הגבלות שימוש</h2>
            <p>אסור להשתמש בשירות למטרות הבאות:</p>
            <ul className="list-disc list-inside space-y-2 mr-6">
              <li>❌ הוצאת דיבה או פגיעה במוניטין עסק ללא הצדקה</li>
              <li>❌ מכירה או הפצה של דוחות לצדדים שלישיים</li>
              <li>❌ Scraping אוטומטי או שימוש ב-bots</li>
              <li>❌ יצירת מסד נתונים מתחרה</li>
              <li>❌ הנדסה לאחור של אלגוריתם ה-AI</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. תיקון טעויות</h2>
            <p>
              אם זיהית מידע שגוי בדוח שלך:
            </p>
            <ol className="list-decimal list-inside space-y-2 mr-6">
              <li><strong>פנה אלינו:</strong> דוא"ל ל-<a href="mailto:support@trustcheck.co.il" className="text-blue-600 hover:underline">support@trustcheck.co.il</a> עם פרטים</li>
              <li><strong>נבדוק:</strong> נאמת את המידע מול המקור המקורי תוך 7 ימים</li>
              <li><strong>נתקן:</strong> אם הטעות אצלנו - תיקון מיידי + עדכון דוח חינם</li>
              <li><strong>טעות במקור:</strong> נפנה אותך לרשות הממשלתית הרלוונטית</li>
            </ol>

            <p className="mt-4 text-sm text-gray-600">
              <strong>שים לב:</strong> אנו לא יכולים לתקן מידע במקורות ממשלתיים (רשם החברות, נט המשפט, וכו').
              עליך לפנות ישירות לרשות הרלוונטית.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. שינויים בהצהרה</h2>
            <p>
              אנו שומרים את הזכות לעדכן הצהרה זו בכל עת. השימוש המתמשך בשירות לאחר 
              שינויים מהווה הסכמה להצהרה המעודכנת.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. יצירת קשר</h2>
            <p>לשאלות או דיווח על בעיות:</p>
            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <p><strong>TrustCheck Israel בע"מ</strong></p>
              <p>ח.פ. 345033898</p>
              <p>דוא"ל: <a href="mailto:support@trustcheck.co.il" className="text-blue-600 hover:underline">support@trustcheck.co.il</a></p>
              <p>טלפון: <a href="tel:+972501234567" className="text-blue-600 hover:underline">050-123-4567</a></p>
            </div>
          </section>

          {/* Final Notice */}
          <section className="border-t-2 border-gray-300 pt-6 mt-8">
            <div className="bg-gray-100 p-6 rounded-lg">
              <p className="text-lg font-bold text-gray-900 mb-3">הסכמה</p>
              <p className="text-gray-800">
                בשימוש בשירות TrustCheck Israel, אתה מצהיר ומסכים כי קראת והבנת הצהרת אחריות זו, 
                ואתה מקבל את כל המגבלות והתנאים המפורטים בה.
              </p>
              <p className="text-gray-700 mt-3 text-sm">
                <strong>שימוש במידע הוא על אחריותך הבלעדית.</strong>
              </p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
