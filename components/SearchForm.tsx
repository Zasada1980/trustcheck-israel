'use client';

import { useState } from 'react';
import * as analytics from '@/lib/analytics';

// Input validation helper
function validateInput(query: string): { type: 'hp_number' | 'phone' | 'name_hebrew' | 'name_english' | 'invalid'; isValid: boolean; message?: string } {
  const trimmed = query.trim();
  
  // H.P. number (9 digits)
  if (/^\d{9}$/.test(trimmed)) {
    return { type: 'hp_number', isValid: true };
  }
  
  // Israeli phone number (10 digits starting with 05)
  if (/^05\d{8}$/.test(trimmed.replace(/[-\s]/g, ''))) {
    return { type: 'phone', isValid: true };
  }
  
  // Hebrew name (at least 2 Hebrew characters)
  if (/[\u0590-\u05FF]{2,}/.test(trimmed)) {
    return { type: 'name_hebrew', isValid: true };
  }
  
  // English name (at least 2 letters)
  if (/[a-zA-Z]{2,}/.test(trimmed)) {
    return { type: 'name_english', isValid: true };
  }
  
  // Invalid input
  return { 
    type: 'invalid', 
    isValid: false, 
    message: 'נא להזין שם עסק (עברית/אנגלית), מספר ח.פ. (9 ספרות) או טלפון (05X-XXXXXXX)' 
  };
}

export default function SearchForm() {
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessName.trim()) {
      setError('נא להזין שם עסק');
      return;
    }

    // Validate input
    const validation = validateInput(businessName);
    if (!validation.isValid) {
      setError(validation.message || 'קלט לא תקין');
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    // Track search event
    analytics.trackSearch(businessName.trim(), validation.type);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: businessName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בטעינת הדוח');
      }

      setReport(data.report);
      
      // Track successful report view
      const trustScore = data.report?.trustScore || 0;
      analytics.trackReportView(businessName.trim(), trustScore);
      
      // Show rating prompt after 3 seconds
      setTimeout(() => {
        setShowRatingPrompt(true);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setError(errorMessage);
      
      // Track error
      analytics.trackError('report_generation', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = (rating: number) => {
    setUserRating(rating);
    setShowRatingPrompt(false);
    
    // Track rating event
    analytics.trackRating(rating);
    
    // Optional: Send to backend for storage
    // fetch('/api/feedback', { method: 'POST', body: JSON.stringify({ rating, businessName }) });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-right">
          בדוק את אמינות העסק
        </h2>
        
        <div className="mb-6">
          <label 
            htmlFor="businessName" 
            className="block text-right text-sm font-medium text-gray-700 mb-2"
          >
            שם העסק או מספר רישום
          </label>
          <input
            type="text"
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="לדוגמה: חנות הצעצועים של דני"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right text-gray-900 placeholder-gray-400"
            style={{ color: '#111827' }}
            disabled={loading}
            dir="rtl"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              מייצר דוח...
            </span>
          ) : (
            '🔍 בדוק עכשיו'
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-right">
            <p className="text-red-800 text-sm">❌ {error}</p>
          </div>
        )}
      </form>

      {/* Report Display */}
      {report && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-right">
            דוח אמינות: {report.metadata.businessName}
          </h3>

          {/* Trust Score */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg text-right">
            <div className="flex items-center justify-end gap-2 mb-2">
              <span className="text-3xl font-bold text-blue-600">
                {report.summary.trustScore}/5
              </span>
              <span className="text-yellow-500 text-2xl">
                {'⭐'.repeat(report.summary.trustScore)}
              </span>
            </div>
            <p className="text-sm text-gray-600">ציון אמינות</p>
          </div>

          {/* Recommendation Badge */}
          <div className="mb-6 text-right">
            {report.summary.recommendation === 'approved' && (
              <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
                ✅ מומלץ לסמוך
              </span>
            )}
            {report.summary.recommendation === 'caution' && (
              <span className="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-semibold">
                ⚠️ זהירות - בדוק היטב
              </span>
            )}
            {report.summary.recommendation === 'rejected' && (
              <span className="inline-block bg-red-100 text-red-800 px-4 py-2 rounded-full font-semibold">
                ❌ לא מומלץ
              </span>
            )}
          </div>

          {/* Strengths */}
          {report.summary.strengths.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 text-right">
                💪 נקודות חוזק
              </h4>
              <ul className="space-y-2 text-right">
                {report.summary.strengths.map((strength: string, index: number) => (
                  <li key={index} className="flex items-start justify-end gap-2">
                    <span className="text-gray-900 font-medium">{strength}</span>
                    <span className="text-green-500 mt-1">✓</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risks */}
          {report.summary.risks.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 text-right">
                ⚠️ סיכונים
              </h4>
              <ul className="space-y-2 text-right">
                {report.summary.risks.map((risk: string, index: number) => (
                  <li key={index} className="flex items-start justify-end gap-2">
                    <span className="text-gray-900 font-medium">{risk}</span>
                    <span className="text-red-500 mt-1">⚠</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full Report */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 text-right">
              📄 דוח מלא
            </h4>
            <div 
              className="prose prose-sm max-w-none text-right text-gray-900" 
              dir="rtl"
              style={{ whiteSpace: 'pre-wrap', color: '#111827' }}
            >
              {report.fullText}
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-6 pt-6 border-t text-xs text-gray-500 text-right">
            <p>נוצר ב: {new Date(report.metadata.generatedAt).toLocaleString('he-IL')}</p>
            <p>מודל: {report.metadata.model}</p>
          </div>

          {/* Rating Prompt */}
          {showRatingPrompt && userRating === null && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 animate-fade-in">
              <h4 className="text-center text-gray-900 font-semibold mb-3">
                האם הדוח עזר לך?
              </h4>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRating(rating)}
                    className="text-3xl hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    title={`${rating} כוכבים`}
                  >
                    {rating <= (userRating || 0) ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">
                1 = לא עזר, 5 = עזר מאוד
              </p>
            </div>
          )}

          {/* Thank you message after rating */}
          {userRating !== null && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200 text-center">
              <p className="text-green-800 font-semibold">
                🙏 תודה על המשוב שלך!
              </p>
              <p className="text-sm text-gray-600 mt-1">
                הדירוג שלך עוזר לנו לשפר את השירות
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
