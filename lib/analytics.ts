// Google Analytics 4 Helper
// Utility functions for tracking events

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// Track page views
export const pageview = (url: string) => {
  if (!GA_TRACKING_ID) return;
  
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};

// Track custom events
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (!GA_TRACKING_ID) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Specific event trackers for TrustCheck
export const trackSearch = (businessName: string, inputType: string) => {
  event({
    action: 'search_business',
    category: 'engagement',
    label: inputType, // 'hp_number', 'phone', 'name_hebrew', 'name_english'
  });
};

export const trackReportView = (businessName: string, trustScore: number) => {
  event({
    action: 'view_report',
    category: 'engagement',
    label: businessName,
    value: trustScore,
  });
};

export const trackRating = (rating: number) => {
  event({
    action: 'user_rating',
    category: 'feedback',
    label: `rating_${rating}`,
    value: rating,
  });
};

export const trackError = (errorType: string, errorMessage: string) => {
  event({
    action: 'error',
    category: 'technical',
    label: `${errorType}: ${errorMessage}`,
  });
};

// TypeScript declarations for gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}
