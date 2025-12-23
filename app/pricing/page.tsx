import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function PricingPage() {
  const plans = [
    {
      name: 'בדיקה חינם',
      price: '₪0',
      period: 'פעם אחת',
      description: 'בדיקה בסיסית ראשונה חינם',
      features: [
        'פרטי עסק בסיסיים',
        'סטטוס משפטי בסיסי',
        'ציון אמינות',
        'המלצות AI',
        'תוקף: 24 שעות',
      ],
      limitations: [
        'עד 3 מקורות מידע',
        'ללא היסטוריה מלאה',
        'ללא עדכונים',
      ],
      cta: 'בדוק עכשיו',
      popular: false,
      link: '/',
    },
    {
      name: 'דוח מלא',
      price: '₪29',
      period: 'לדוח',
      description: 'בדיקה מקיפה עם כל המידע',
      features: [
        'כל מקורות המידע (7)',
        'היסטוריה מלאה 5 שנים',
        'תיקים משפטיים מלאים',
        'הוצאה לפועל',
        'חשבונות מוגבלים',
        'סטטוס מע"מ בזמן אמת',
        'דוח PDF להורדה',
        'תוקף: 30 ימים',
        'עדכון אחד חינם',
      ],
      limitations: [],
      cta: 'קנה דוח מלא',
      popular: true,
      link: '/',
    },
    {
      name: 'מנוי חודשי',
      price: '₪99',
      period: 'לחודש',
      description: 'לעסקים ומשתמשים תדירים',
      features: [
        '5 דוחות מלאים לחודש',
        'כל התכונות של דוח מלא',
        'עדכונים אוטומטיים',
        'התראות על שינויים',
        'היסטוריה בלתי מוגבלת',
        'תמיכה עדיפות',
        'API Access (בקרוב)',
        'תקופת ניסיון 7 ימים',
      ],
      limitations: [],
      cta: 'התחל מנוי',
      popular: false,
      link: '/',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4" dir="rtl">
            מחירים שקופים, ללא הפתעות
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto" dir="rtl">
            בחר את החבילה המתאימה לך - כל התשלומים מאובטחים ומוצפנים
          </p>

          {/* Savings Banner */}
          <div className="mt-8 bg-green-100 border-2 border-green-500 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-green-800 font-semibold" dir="rtl">
              💰 חוסכים ממוצע של ₪1,850 לכל בדיקה!
            </p>
            <p className="text-green-700 text-sm mt-1" dir="rtl">
              לעומת עלות ממוצעת של הונאה (₪1,879)
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl shadow-xl ${
                  plan.popular
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white transform scale-105'
                    : 'bg-white border-2 border-gray-200'
                } p-8 transition-all hover:shadow-2xl`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 right-1/2 transform translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                    🔥 הכי פופולרי
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6" dir="rtl">
                  <h3
                    className={`text-2xl font-bold mb-2 ${
                      plan.popular ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <div className="mb-2">
                    <span
                      className={`text-5xl font-extrabold ${
                        plan.popular ? 'text-white' : 'text-blue-600'
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={`text-lg ${
                        plan.popular ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {' '}
                      / {plan.period}
                    </span>
                  </div>
                  <p
                    className={`text-sm ${
                      plan.popular ? 'text-blue-100' : 'text-gray-600'
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-6" dir="rtl">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span
                        className={`text-lg flex-shrink-0 ${
                          plan.popular ? 'text-green-300' : 'text-green-500'
                        }`}
                      >
                        ✓
                      </span>
                      <span
                        className={`text-sm ${
                          plan.popular ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span
                        className={`text-lg flex-shrink-0 ${
                          plan.popular ? 'text-red-300' : 'text-red-500'
                        }`}
                      >
                        ✗
                      </span>
                      <span
                        className={`text-sm ${
                          plan.popular ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {limitation}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link
                  href={plan.link}
                  className={`block w-full py-3 px-6 rounded-lg font-bold text-center transition-all ${
                    plan.popular
                      ? 'bg-white text-blue-600 hover:bg-gray-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8" dir="rtl">
            השוואת תכונות מלאה
          </h2>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full" dir="rtl">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <tr>
                  <th className="py-4 px-6 text-right">תכונה</th>
                  <th className="py-4 px-6 text-center">חינם</th>
                  <th className="py-4 px-6 text-center">דוח מלא</th>
                  <th className="py-4 px-6 text-center">מנוי</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  ['פרטי עסק בסיסיים', '✓', '✓', '✓'],
                  ['היסטוריה 5 שנים', '✗', '✓', '✓'],
                  ['תיקים משפטיים', 'חלקי', 'מלא', 'מלא'],
                  ['הוצאה לפועל', '✗', '✓', '✓'],
                  ['סטטוס מע"מ', '✗', '✓', '✓'],
                  ['חשבונות מוגבלים', '✗', '✓', '✓'],
                  ['דוח PDF', '✗', '✓', '✓'],
                  ['עדכונים אוטומטיים', '✗', '✗', '✓'],
                  ['התראות', '✗', '✗', '✓'],
                  ['תמיכה עדיפות', '✗', '✗', '✓'],
                  ['API Access', '✗', '✗', 'בקרוב'],
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium text-gray-900">
                      {row[0]}
                    </td>
                    <td className="py-3 px-6 text-center">{row[1]}</td>
                    <td className="py-3 px-6 text-center">{row[2]}</td>
                    <td className="py-3 px-6 text-center">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8" dir="rtl">
            שאלות נפוצות על תמחור
          </h2>

          <div className="space-y-4" dir="rtl">
            {[
              {
                q: 'איך אשלם?',
                a: 'כרטיס אשראי, ביט, PayPal - כל התשלומים מאובטחים דרך Stripe',
              },
              {
                q: 'האם יש עלויות נסתרות?',
                a: 'לא! המחיר שאתה רואה הוא המחיר הסופי, ללא עמלות או תוספות.',
              },
              {
                q: 'מה קורה אם לא מצאתם מידע על העסק?',
                a: 'אם לא נמצא מידע כלל, תקבל החזר כספי מלא תוך 24 שעות.',
              },
              {
                q: 'האם אפשר לבטל מנוי?',
                a: 'כן, ניתן לבטל בכל עת. אין התחייבות או קנסות ביטול.',
              },
              {
                q: 'איך עובד תקופת הניסיון?',
                a: 'במנוי החודשי יש 7 ימי ניסיון חינם. ביטול בתקופה זו ללא חיוב.',
              },
            ].map((item, idx) => (
              <details
                key={idx}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  {item.q}
                </summary>
                <p className="mt-3 text-gray-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" dir="rtl">
            מוכן להתחיל?
          </h2>
          <p className="text-xl text-blue-100 mb-8" dir="rtl">
            בדיקה ראשונה חינם - ללא כרטיס אשראי
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg transition-all text-lg"
            >
              בדוק עכשיו חינם →
            </Link>
            <Link
              href="/"
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-bold py-4 px-8 rounded-lg transition-all text-lg"
            >
              ראה דוגמה
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
