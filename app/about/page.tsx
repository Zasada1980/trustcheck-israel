import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function AboutPage() {
  const team = [
    {
      name: 'דן כהן',
      role: 'CEO & Founder',
      description: 'אב לשלושה ילדים, נפגע מהונאה של גן ילדים פיקטיבי',
      image: '👨‍💼',
    },
    {
      name: 'שרה לוי',
      role: 'CTO',
      description: '15 שנות ניסיון בפיתוח מערכות AI ואבטחת מידע',
      image: '👩‍💻',
    },
    {
      name: 'יוסי מזרחי',
      role: 'Head of Data',
      description: 'מומחה לניתוח נתוני ממשל ומשפט',
      image: '👨‍🔬',
    },
    {
      name: 'רחל אברהם',
      role: 'Customer Success',
      description: 'מטפלת באלפי משפחות ישראליות',
      image: '👩‍💼',
    },
  ];

  const milestones = [
    { date: 'דצמבר 2025', event: 'השקת פלטפורמה', description: 'גרסת MVP ראשונה' },
    { date: 'ינואר 2026', event: '500 משתמשים', description: 'יעד Phase 1' },
    { date: 'פברואר 2026', event: 'אינטגרציה מלאה', description: 'כל מקורות המידע הממשלתיים' },
    { date: 'מרץ 2026', event: 'השקת API', description: 'גישה לעסקים ומפתחים' },
  ];

  const partners = [
    { name: 'משרד המשפטים', type: 'רשם החברות', logo: '⚖️' },
    { name: 'רשות המסים', type: 'סטטוס מע"מ', logo: '💰' },
    { name: 'בנק ישראל', type: 'חשבונות מוגבלים', logo: '🏦' },
    { name: 'נט המשפט', type: 'תיקים משפטיים', logo: '📜' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4" dir="rtl">
            המשימה שלנו: להגן על משפחות ישראליות
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto" dir="rtl">
            פלטפורמה ישראלית ראשונה לבדיקת אמינות עסקים בזמן אמת
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-white shadow-xl" dir="rtl">
            <h2 className="text-3xl font-bold mb-6">איך הכל התחיל</h2>
            <div className="space-y-4 text-lg">
              <p>
                <strong>דצמבר 2024</strong> - דן, אב לשלושה ילדים, שילם ₪3,500 לגן ילדים פרטי. 
                הגן נסגר אחרי שבועיים, והכסף אבד.
              </p>
              <p>
                בדיקה במשרד המשפטים חשפה: לבעלי הגן 12 תיקים משפטיים, 4 הליכי הוצל"פ פתוחים, 
                וחשבון בנק מוגבל. <strong>כל המידע היה זמין בחינם</strong> - אבל אף אחד לא ידע איפה לחפש.
              </p>
              <p className="font-semibold text-yellow-300">
                המידע היה שם כל הזמן - פשוט לא היה כלי שמאחד אותו.
              </p>
              <p>
                <strong>TrustCheck נולד</strong> מתוך המטרה לעשות את המידע הזה נגיש לכל הורה בישראל, 
                תוך 5 שניות, לפני שהוא משלם.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12" dir="rtl">
            הבעיה והפתרון
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Problem */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8" dir="rtl">
              <h3 className="text-2xl font-bold text-red-900 mb-4">❌ הבעיה</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 flex-shrink-0">•</span>
                  <span>משפחות מאבדות בממוצע <strong>₪1,879</strong> בכל הונאה</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 flex-shrink-0">•</span>
                  <span><strong>47%</strong> מההונאות היו ניתנות למניעה</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 flex-shrink-0">•</span>
                  <span>המידע הממשלתי <strong>מפוזר</strong> ב-7 אתרים שונים</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 flex-shrink-0">•</span>
                  <span>בדיקה ידנית לוקחת <strong>2-4 שעות</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 flex-shrink-0">•</span>
                  <span>פלטפורמות קיימות עולות <strong>₪200-500</strong> לדוח</span>
                </li>
              </ul>
            </div>

            {/* Solution */}
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8" dir="rtl">
              <h3 className="text-2xl font-bold text-green-900 mb-4">✓ הפתרון</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 flex-shrink-0">✓</span>
                  <span>בדיקה תוך <strong>5 שניות</strong> במקום שעות</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 flex-shrink-0">✓</span>
                  <span>מחיר התחלתי <strong>₪0</strong> (בדיקה ראשונה חינם)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 flex-shrink-0">✓</span>
                  <span>כל 7 מקורות המידע <strong>במקום אחד</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 flex-shrink-0">✓</span>
                  <span>ניתוח AI חכם עם <strong>ציון אמינות</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 flex-shrink-0">✓</span>
                  <span>נתונים <strong>בזמן אמת</strong> מהממשלה</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12" dir="rtl">
            הצוות שלנו
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow"
                dir="rtl"
              >
                <div className="text-6xl mb-4">{member.image}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-blue-600 font-semibold mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12" dir="rtl">
            מפת הדרכים שלנו
          </h2>

          <div className="space-y-6">
            {milestones.map((milestone, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-md p-6 border-r-4 border-blue-600"
                dir="rtl"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-600 font-semibold mb-1">
                      {milestone.date}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {milestone.event}
                    </h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Partners */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4" dir="rtl">
            מקורות המידע שלנו
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto" dir="rtl">
            משתמשים במידע רשמי מממשלת ישראל ומוסדות ממשלתיים
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {partners.map((partner, idx) => (
              <div
                key={idx}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center hover:border-blue-500 transition-colors"
                dir="rtl"
              >
                <div className="text-5xl mb-3">{partner.logo}</div>
                <h3 className="font-bold text-gray-900 mb-1">{partner.name}</h3>
                <p className="text-sm text-gray-600">{partner.type}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm" dir="rtl">
              + 3 מקורות מידע נוספים: הוצאה לפועל, נט המשפט, data.gov.il
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12" dir="rtl">
            הערכים שלנו
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎯',
                title: 'שקיפות מלאה',
                description: 'כל נתון שאנחנו מציגים מגיע ממקור ממשלתי מאומת',
              },
              {
                icon: '🔒',
                title: 'פרטיות ואבטחה',
                description: 'המידע שלך מוצפן ולא נשמר אחרי הבדיקה',
              },
              {
                icon: '💙',
                title: 'משפחות ישראליות קודם',
                description: 'המחיר והשירות מותאמים למשפחות, לא לעסקים גדולים',
              },
            ].map((value, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-lg p-8 text-center"
                dir="rtl"
              >
                <div className="text-5xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" dir="rtl">
            הצטרף למהפכה
          </h2>
          <p className="text-xl text-gray-600 mb-8" dir="rtl">
            עזור לנו להגן על עוד משפחות ישראליות מהונאות
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 font-bold py-4 px-8 rounded-lg transition-all text-lg"
            >
              בדוק עסק עכשיו →
            </Link>
            <Link
              href="/pricing"
              className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-4 px-8 rounded-lg transition-all text-lg"
            >
              ראה מחירים
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
