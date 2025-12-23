/**
 * Tax Certificates Scraper
 * 
 * Scrapes Israeli Tax Authority public certificates database:
 * - Bookkeeping approvals (ניהול ספרים)
 * - Withholding tax certificates (ניכוי מס במקור)
 * 
 * Source: https://taxinfo.taxes.gov.il/gmishurim/
 * Legal: Public data, 7-day cache, respectful rate limiting
 * 
 * @module lib/scrapers/tax_certificates
 */

import { chromium, Browser, Page } from 'playwright';

export interface TaxCertificates {
  hpNumber: string;
  companyName: string;
  vatFile: string | null;
  withholdingTaxFile: string | null;
  bookkeepingApproval: {
    hasApproval: boolean;
    expirationDate: string | null;
    status: 'יש אישור' | 'אין אישור' | 'לא ידוע';
  };
  withholdingTaxCategories: {
    services: CertificateStatus; // שרותים נכסים
    construction: CertificateStatus; // בניה והובלה
    securityCleaning: CertificateStatus; // שמירה ניקיון
    production: CertificateStatus; // שרותי הפקה
    consulting: CertificateStatus; // ייעוץ
    planningAdvertising: CertificateStatus; // תכנון ופרסום
    itServices: CertificateStatus; // שרותי מחשוב
    insurancePension: CertificateStatus; // ביטוח ופנסיה
  };
  _meta: {
    sourceUrl: string;
    scrapedAt: string;
    scrapeSuccess: boolean;
    errorMessage?: string;
  };
}

export type CertificateStatus = 
  | 'עפ\'\'י תקנות מ\'\'ה' // Per regulations (has approval)
  | 'אין אישור' // No approval
  | 'לא ידוע'; // Unknown

/**
 * Scrape tax certificates for a company
 * 
 * @param hpNumber - Israeli company HP number (9 digits)
 * @param options - Scraping options
 * @returns Tax certificates data
 * 
 * @example
 * const certs = await scrapeTaxCertificates('515972651');
 * console.log(certs.bookkeepingApproval.hasApproval); // false
 */
export async function scrapeTaxCertificates(
  hpNumber: string,
  options: {
    timeout?: number; // Max wait time (ms)
    headless?: boolean; // Headless browser mode
    retries?: number; // Retry attempts on failure
  } = {}
): Promise<TaxCertificates> {
  const {
    timeout = 30000, // 30 seconds
    headless = true,
    retries = 3,
  } = options;

  let browser: Browser | null = null;
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < retries) {
    try {
      attempt++;
      console.log(`[TaxCertificates] Scraping HP ${hpNumber} (attempt ${attempt}/${retries})...`);

      // Launch browser
      browser = await chromium.launch({
        headless,
        timeout,
      });

      const context = await browser.newContext({
        locale: 'he-IL',
        userAgent: 'TrustCheckBot/1.0 (+https://trustcheck.co.il/about/bot)',
      });

      const page = await context.newPage();
      page.setDefaultTimeout(timeout);

      // Navigate to form
      console.log('[TaxCertificates] Navigating to form...');
      await page.goto('https://taxinfo.taxes.gov.il/gmishurim/firstPage.aspx', {
        waitUntil: 'networkidle',
      });

      // Select "אישור לישות" (Certificate for Entity)
      console.log('[TaxCertificates] Selecting certificate type...');
      await page.click('#rbMekabel');

      // Wait for button to be enabled (form validation)
      await page.waitForSelector('#btnNext', { state: 'visible' });
      
      // Click "המשך" (Continue)
      await page.click('#btnNext');

      // Wait for input form to load
      await page.waitForURL(/frmInputMekabel\.aspx/);
      console.log('[TaxCertificates] Input form loaded');

      // Enter HP number
      console.log(`[TaxCertificates] Entering HP number: ${hpNumber}`);
      await page.fill('#txtMisTik', hpNumber);

      // Wait for form validation
      await page.waitForTimeout(1000);

      // Submit form (use visible continue button)
      await page.click('#btnNext');

      // Wait for results page
      await page.waitForURL(/frmIshurimInfo\.aspx/, { timeout });
      console.log('[TaxCertificates] Results page loaded');

      // Wait for data to appear (check for error or success)
      await page.waitForSelector('.results-container, .error-message, #lblErr', { timeout });

      // Check for error message
      const errorMessage = await page.textContent('#lblErr');
      if (errorMessage && errorMessage.trim()) {
        throw new Error(`Tax Authority error: ${errorMessage}`);
      }

      // Extract data
      console.log('[TaxCertificates] Extracting data...');
      const data = await extractCertificatesData(page, hpNumber);

      await browser.close();
      console.log(`[TaxCertificates] ✅ Success for HP ${hpNumber}`);

      return data;

    } catch (error) {
      lastError = error as Error;
      console.error(`[TaxCertificates] ❌ Attempt ${attempt} failed:`, error);

      if (browser) {
        await browser.close().catch(() => {});
      }

      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`[TaxCertificates] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  console.error(`[TaxCertificates] ❌ All ${retries} attempts failed for HP ${hpNumber}`);
  
  return {
    hpNumber,
    companyName: 'לא ידוע',
    vatFile: null,
    withholdingTaxFile: null,
    bookkeepingApproval: {
      hasApproval: false,
      expirationDate: null,
      status: 'לא ידוע',
    },
    withholdingTaxCategories: {
      services: 'לא ידוע',
      construction: 'לא ידוע',
      securityCleaning: 'לא ידוע',
      production: 'לא ידוע',
      consulting: 'לא ידוע',
      planningAdvertising: 'לא ידוע',
      itServices: 'לא ידוע',
      insurancePension: 'לא ידוע',
    },
    _meta: {
      sourceUrl: 'https://taxinfo.taxes.gov.il/gmishurim/',
      scrapedAt: new Date().toISOString(),
      scrapeSuccess: false,
      errorMessage: lastError?.message || 'Unknown error',
    },
  };
}

/**
 * Extract certificates data from results page
 * @internal
 */
async function extractCertificatesData(
  page: Page,
  hpNumber: string
): Promise<TaxCertificates> {
  // Extract company name
  const companyName = await page.textContent('#lblName, .company-name') || 'לא ידוע';

  // Extract tax file numbers
  const vatFile = await page.textContent('#lblVatFile, .vat-file');
  const withholdingTaxFile = await page.textContent('#lblWithholdingFile, .withholding-file');

  // Extract bookkeeping approval
  const bookkeepingText = await page.textContent('#lblBookkeeping, .bookkeeping-status') || 'לא ידוע';
  const hasBookkeepingApproval = bookkeepingText.includes('יש אישור');
  const bookkeepingExpiration = await extractDate(page, '#lblBookkeepingExpiration, .bookkeeping-expiration');

  // Extract withholding tax categories
  // Note: Actual selectors will be determined after manual inspection
  const withholdingTaxCategories = {
    services: await extractCertificateStatus(page, '#lblServices, .category-services'),
    construction: await extractCertificateStatus(page, '#lblConstruction, .category-construction'),
    securityCleaning: await extractCertificateStatus(page, '#lblSecurity, .category-security'),
    production: await extractCertificateStatus(page, '#lblProduction, .category-production'),
    consulting: await extractCertificateStatus(page, '#lblConsulting, .category-consulting'),
    planningAdvertising: await extractCertificateStatus(page, '#lblPlanning, .category-planning'),
    itServices: await extractCertificateStatus(page, '#lblIT, .category-it'),
    insurancePension: await extractCertificateStatus(page, '#lblInsurance, .category-insurance'),
  };

  return {
    hpNumber,
    companyName: companyName.trim(),
    vatFile: vatFile?.trim() || null,
    withholdingTaxFile: withholdingTaxFile?.trim() || null,
    bookkeepingApproval: {
      hasApproval: hasBookkeepingApproval,
      expirationDate: bookkeepingExpiration,
      status: hasBookkeepingApproval ? 'יש אישור' : 'אין אישור',
    },
    withholdingTaxCategories,
    _meta: {
      sourceUrl: 'https://taxinfo.taxes.gov.il/gmishurim/',
      scrapedAt: new Date().toISOString(),
      scrapeSuccess: true,
    },
  };
}

/**
 * Extract certificate status from page
 * @internal
 */
async function extractCertificateStatus(
  page: Page,
  selector: string
): Promise<CertificateStatus> {
  const text = await page.textContent(selector);
  if (!text) return 'לא ידוע';

  const normalized = text.trim();
  if (normalized.includes('עפ') || normalized.includes('תקנות')) {
    return 'עפ\'\'י תקנות מ\'\'ה';
  } else if (normalized.includes('אין')) {
    return 'אין אישור';
  }
  return 'לא ידוע';
}

/**
 * Extract date from page (DD/MM/YYYY format)
 * @internal
 */
async function extractDate(page: Page, selector: string): Promise<string | null> {
  const text = await page.textContent(selector);
  if (!text) return null;

  // Israeli date format: DD/MM/YYYY
  const dateMatch = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    return `${year}-${month}-${day}`; // ISO format
  }

  return null;
}

/**
 * Rate limiter to prevent overwhelming the server
 * 
 * Usage:
 * await rateLimiter.wait();
 * const data = await scrapeTaxCertificates(hpNumber);
 */
export const rateLimiter = {
  lastRequestTime: 0,
  minDelay: 2000, // 2 seconds between requests

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    const delay = Math.max(0, this.minDelay - elapsed);

    if (delay > 0) {
      console.log(`[RateLimiter] Waiting ${delay}ms before next request...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  },
};
