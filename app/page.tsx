import SearchForm from '@/components/SearchForm';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            TrustCheck Israel
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            בדיקת אמינות עסקים בישראל
          </p>
          <p className="text-lg text-gray-500">
            בדוק את העסק לפני שאתה משלם - דוח מלא תוך שניות 🚀
          </p>
        </div>

        {/* Search Form Component */}
        <SearchForm />

        {/* Status Banner */}
        <div className="mt-12 bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-right">
            📊 סטטוס מערכת - Phase 1 MVP
          </h2>
          <ul className="text-right space-y-2 text-sm text-gray-700">
            <li>✅ שרת Hetzner CX23 פעיל</li>
            <li>✅ Docker + NGINX מותקנים</li>
            <li>✅ SSL Certificates מוכנים</li>
            <li>✅ Google Gemini 2.0 Flash מחובר</li>
            <li>🚧 CheckID API - Mock Data (בפיתוח)</li>
            <li>⏳ Stripe תשלומים - Phase 2</li>
          </ul>
          <div className="mt-4 pt-4 border-t text-xs text-gray-500 text-right">
            <p>🌍 Server: Hetzner CX23 | Nuremberg, Germany</p>
            <p>🤖 AI Model: Google Gemini 2.0 Flash (1500 req/day FREE)</p>
            <p>⏱️ Phase 1: MVP &quot;Validator&quot; | 4 שבועות פיתוח</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>🔒 כל הנתונים מוצפנים ומאובטחים</p>
          <p className="mt-2">© 2025 TrustCheck Israel - Made with ❤️ for Israeli Parents</p>
        </div>
      </div>
    </main>
  );
}
