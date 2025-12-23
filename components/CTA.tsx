// CTA (Call to Action) Component
import Link from 'next/link';

export default function CTA() {
  return (
    <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          מוכנים להתחיל?
        </h2>
        <p className="text-xl text-blue-100 mb-8" dir="rtl">
          בדוק את העסק הבא שלך תוך 5 שניות - הבדיקה הראשונה חינם!
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-bold text-lg transition-colors shadow-lg"
          >
            <span>בדוק עכשיו חינם</span>
            <span>🚀</span>
          </Link>
          
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors border-2 border-white"
          >
            <span>ראה מחירים</span>
            <span>💰</span>
          </Link>
        </div>

        <p className="mt-6 text-sm text-blue-100">
          ✓ ללא כרטיס אשראי &nbsp; ✓ ללא התחייבות &nbsp; ✓ תוצאות מיידיות
        </p>
      </div>
    </section>
  );
}
