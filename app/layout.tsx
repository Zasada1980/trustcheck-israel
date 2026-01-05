import type { Metadata } from 'next';
import './globals.css';
import AIChat from '@/components/AIChat';
import GoogleAnalytics from '@/components/GoogleAnalytics';

export const metadata: Metadata = {
  title: 'TrustCheck Israel | בדיקת אמינות עסקים',
  description: 'בדוק את אמינות העסק לפני שאתה משלם - פלטפורמה להורים לבדיקת עסקים בישראל',
  keywords: ['בדיקת עסקים', 'אמינות', 'ישראל', 'business check', 'trust', 'verification'],
  authors: [{ name: 'TrustCheck Israel' }],
  openGraph: {
    title: 'TrustCheck Israel',
    description: 'בדוק את אמינות העסק לפני שאתה משלם',
    url: 'https://trustcheck.co.il',
    siteName: 'TrustCheck Israel',
    locale: 'he_IL',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TrustCheck" />
      </head>
      <body className="antialiased">
        {children}
        <AIChat />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
