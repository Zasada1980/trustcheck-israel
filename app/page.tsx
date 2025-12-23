import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchForm from '@/components/SearchForm';
import Features from '@/components/Features';
import Stats from '@/components/Stats';
import Testimonials from '@/components/Testimonials';
import FAQ from '@/components/FAQ';
import CTA from '@/components/CTA';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header with Navigation */}
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero Text */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              בדוק את העסק
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                לפני שאתה משלם
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-4">
              בדיקת אמינות עסקים בישראל תוך 5 שניות
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto" dir="rtl">
              הגן על המשפחה שלך מפני הונאות - בדוק גנים, מורים פרטיים, קבלנים ועוד
            </p>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>716,714 עסקים במאגר</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>נתונים ממקורות ממשלתיים</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>מאובטח 100%</span>
              </div>
            </div>
          </div>

          {/* Search Form Component */}
          <SearchForm />

          {/* Quick Stats Below Search */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">1,247</div>
              <div className="text-xs text-gray-600">בדיקות היום</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">₪47K</div>
              <div className="text-xs text-gray-600">נחסכו השבוע</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">4.9⭐</div>
              <div className="text-xs text-gray-600">דירוג ממוצע</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">523</div>
              <div className="text-xs text-gray-600">משתמשים פעילים</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <Features />

      {/* Stats Section */}
      <Stats />

      {/* Testimonials Section */}
      <Testimonials />

      {/* FAQ Section */}
      <FAQ />

      {/* CTA Section */}
      <CTA />

      {/* Footer */}
      <Footer />
    </div>
  );
}
