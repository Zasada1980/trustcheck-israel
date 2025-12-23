// Features Section Component
'use client';

export default function Features() {
  const features = [
    {
      icon: '🔍',
      title: 'בדיקה מקיפה',
      description: 'בדיקת עסקים מול רשם החברות, בתי משפט, הוצאה לפועל ובנק ישראל',
      color: 'blue'
    },
    {
      icon: '⚡',
      title: 'תוצאות מיידיות',
      description: 'קבל דוח מלא תוך 3-5 שניות עם ניתוח AI מתקדם',
      color: 'indigo'
    },
    {
      icon: '🛡️',
      title: 'הגנה מפני הונאות',
      description: 'זיהוי עסקים בעייתיים: חובות, חשבונות מוגבלים, פשיטת רגל',
      color: 'purple'
    },
    {
      icon: '🤖',
      title: 'AI חכם',
      description: 'Google Gemini 2.0 Flash מנתח את הנתונים ומספק המלצות מותאמות',
      color: 'pink'
    },
    {
      icon: '💰',
      title: 'מחיר הוגן',
      description: 'בדיקה ראשונה חינם, דוחות מלאים החל מ-₪99',
      color: 'green'
    },
    {
      icon: '🔒',
      title: 'מאובטח ופרטי',
      description: 'הצפנת SSL, אין שמירת נתונים, עומד בתקן GDPR',
      color: 'red'
    }
  ];

  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    indigo: 'from-indigo-500 to-indigo-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            למה TrustCheck?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto" dir="rtl">
            הפלטפורמה היחידה בישראל שמשלבת נתונים ממקורות ממשלתיים עם בינה מלאכותית מתקדמת
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${colorMap[feature.color]} flex items-center justify-center text-3xl mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 text-right">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-right" dir="rtl">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
