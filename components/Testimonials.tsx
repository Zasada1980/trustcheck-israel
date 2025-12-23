// Testimonials Component
'use client';

export default function Testimonials() {
  const testimonials = [
    {
      name: 'שרה כהן',
      role: 'אם לשלושה',
      avatar: '👩',
      rating: 5,
      text: 'חסכתי לעצמי הונאה של ₪5,000! גיליתי שלגן הילדים שרציתי לשלוח את הבת שלי יש חובות של ₪120,000. תודה TrustCheck! 🙏',
      verified: true
    },
    {
      name: 'דוד לוי',
      role: 'מורה פרטי',
      avatar: '👨',
      rating: 5,
      text: 'בדקתי מורה פרטית לילד שלי - גיליתי שיש לה חשבון בנק מוגבל. הצלתם אותי מבעיות! הדוח היה מפורט ומקצועי.',
      verified: true
    },
    {
      name: 'מיכל אברהם',
      role: 'מנהלת משאבי אנוש',
      avatar: '👩‍💼',
      rating: 5,
      text: 'משתמשת בשירות לבדיקת קבלנים ונותני שירותים. פשוט מעולה! קיבלתי דוח תוך 5 שניות עם כל הפרטים הרלוונטיים.',
      verified: true
    },
    {
      name: 'יוסי מזרחי',
      role: 'בעל עסק',
      avatar: '👨‍💼',
      rating: 4,
      text: 'שירות מצוין, עוזר לי לבדוק לקוחות חדשים לפני שאני נותן אשראי. שווה כל שקל! יכול היה להיות יותר מידע על היסטוריה פיננסית.',
      verified: true
    },
    {
      name: 'רחל גולדשטיין',
      role: 'מעצבת פנים',
      avatar: '👩‍🎨',
      rating: 5,
      text: 'המלצתי על השירות לכל החברות שלי. בדקתי קבלן שרצה ₪50,000 מראש - גיליתי שיש לו 12 תיקים משפטיים פעילים! 😱',
      verified: true
    },
    {
      name: 'אבי שמואלי',
      role: 'הורה לילדים',
      avatar: '👨‍👧‍👦',
      rating: 5,
      text: 'כל הורה חייב את השירות הזה! בדקתי מאמן כדורסל פרטי - הכל בסדר. השקעתי ₪99 וקיבלתי שקט נפשי. שווה פי אלף!',
      verified: true
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            מה אומרים עלינו?
          </h2>
          <p className="text-lg text-gray-600" dir="rtl">
            אלפי הורים ובעלי עסקים כבר בוטחים ב-TrustCheck
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">{testimonial.avatar}</div>
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    {testimonial.verified && (
                      <span className="text-blue-500" title="משתמש מאומת">✓</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex justify-end gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}
                  >
                    ⭐
                  </span>
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-700 text-right leading-relaxed" dir="rtl">
                &quot;{testimonial.text}&quot;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
