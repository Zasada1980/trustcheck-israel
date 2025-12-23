// Statistics Section Component
'use client';

import { useEffect, useState } from 'react';

export default function Stats() {
  const [counts, setCounts] = useState({
    checks: 0,
    users: 0,
    companies: 0,
    saved: 0
  });

  const finalStats = {
    checks: 1247,
    users: 523,
    companies: 716714,
    saved: 47200
  };

  useEffect(() => {
    // Animated counter
    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setCounts({
        checks: Math.floor(finalStats.checks * progress),
        users: Math.floor(finalStats.users * progress),
        companies: Math.floor(finalStats.companies * progress),
        saved: Math.floor(finalStats.saved * progress)
      });

      if (step >= steps) {
        clearInterval(timer);
        setCounts(finalStats);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-16 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            המספרים מדברים בעד עצמם
          </h2>
          <p className="text-lg text-blue-100" dir="rtl">
            אלפי הורים כבר השתמשו ב-TrustCheck להגן על המשפחה שלהם
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold mb-2">
              {counts.checks.toLocaleString()}+
            </div>
            <div className="text-blue-100 text-sm md:text-base">
              בדיקות בוצעו
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold mb-2">
              {counts.users.toLocaleString()}+
            </div>
            <div className="text-blue-100 text-sm md:text-base">
              משתמשים פעילים
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold mb-2">
              {counts.companies.toLocaleString()}
            </div>
            <div className="text-blue-100 text-sm md:text-base">
              עסקים במאגר
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold mb-2">
              ₪{counts.saved.toLocaleString()}
            </div>
            <div className="text-blue-100 text-sm md:text-base">
              נחסכו מהונאות
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
