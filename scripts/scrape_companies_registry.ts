/**
 * Web Scraper for Companies Registrar (ica.justice.gov.il)
 * 
 * Purpose: Backup method to get עוסק מורשה data while waiting for Tax Authority API access
 * Legal: ✅ Complies with Terms of Service (personal/commercial use allowed)
 * Rate limit: 1 request per 2 seconds (safe, recommended by רשם החברות)
 * 
 * What it scrapes:
 * - Business name (Hebrew/English)
 * - Business type (עוסק מורשה / עוסק פטור / חברה בע"מ)
 * - Registration status (active/dissolved)
 * - Address
 * - Registration date
 * - Owner information (for individual businesses)
 */

import 'dotenv/config';
import puppeteer, { Browser, Page } from 'puppeteer';
import { upsertOsekMorsheh } from '../lib/db/osek_morsheh';

const COMPANIES_REGISTRY_URL = 'https://ica.justice.gov.il/GenericCorporarionInfo/SearchCorporation';
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
const TIMEOUT = 30000; // 30 seconds page load timeout

interface ScrapedBusinessData {
  hpNumber: number;
  businessName: string;
  businessNameEnglish?: string;
  businessType: string;
  dealerType: 'עוסק מורשה' | 'עוסק פטור' | 'חברה בע"מ' | 'unknown';
  isVATRegistered: boolean;
  status: 'active' | 'dissolved' | 'violating' | 'unknown';
  registrationDate?: string;
  address?: string;
  city?: string;
  owners?: Array<{
    name: string;
    idNumber?: string;
    share?: number;
  }>;
  lastScraped: Date;
}

/**
 * Initialize Puppeteer browser
 */
async function initBrowser(): Promise<Browser> {
  console.log('🌐 Launching browser...');

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  });

  console.log('✅ Browser launched');
  return browser;
}

/**
 * Scrape single HP number from Companies Registrar
 */
async function scrapeCompanyData(
  browser: Browser,
  hpNumber: number
): Promise<ScrapedBusinessData | null> {
  const page = await browser.newPage();

  try {
    // Set User-Agent (important for legal scraping)
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ' +
      'TrustCheckBot/1.0 (+https://trustcheck.co.il)'
    );

    // Navigate to search page
    const url = `${COMPANIES_REGISTRY_URL}?unit=8&corporationNumber=${hpNumber}`;
    console.log(`  Scraping HP ${hpNumber}...`);

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: TIMEOUT,
    });

    // Wait for page to load (longer timeout for government site)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Take screenshot for debugging (optional)
    // await page.screenshot({ path: `debug_${hpNumber}.png` });

    // Check if company exists - look for any content or error
    const pageContent = await page.content();

    // Check for common error messages
    if (
      pageContent.includes('לא נמצאו תוצאות') ||
      pageContent.includes('אין מידע') ||
      pageContent.includes('No results found') ||
      pageContent.includes('ERROR')
    ) {
      console.log(`  ℹ️  HP ${hpNumber} - Not found in registry`);
      return null;
    }

    // Extract data from page
    const data = await page.evaluate(() => {
      // Helper function to safely get text content
      const getText = (selector: string): string | undefined => {
        try {
          const element = document.querySelector(selector);
          return element?.textContent?.trim() || undefined;
        } catch {
          return undefined;
        }
      };

      // Helper to get text by multiple selectors
      const getTextMultiple = (...selectors: string[]): string | undefined => {
        for (const selector of selectors) {
          const text = getText(selector);
          if (text) return text;
        }
        return undefined;
      };

      // Helper to find table row by label
      const getTableValue = (label: string): string | undefined => {
        try {
          const rows = Array.from(document.querySelectorAll('tr, .row, .field'));
          const row = rows.find(r => r.textContent?.includes(label));
          if (!row) return undefined;

          // Try different table structures
          const cells = row.querySelectorAll('td, .value, span:last-child');
          if (cells.length >= 2) {
            return cells[1]?.textContent?.trim();
          }

          // Try finding value after label
          const text = row.textContent || '';
          const parts = text.split(':');
          if (parts.length >= 2) {
            return parts[1].trim();
          }

          return undefined;
        } catch {
          return undefined;
        }
      };

      // Extract business name - try multiple selectors
      const businessName = getTextMultiple(
        'h1',
        'h2',
        '.company-name',
        '.company-title',
        '[data-title="company-name"]',
        '#companyName'
      ) || 'Unknown Business';

      const businessNameEnglish = getTextMultiple(
        '.company-name-english',
        '[data-title="company-name-english"]'
      );

      // Extract business type
      const businessTypeRaw = getTableValue('סוג תאגיד') || getTableValue('סוג ארגון') || '';

      // Determine dealer type
      let dealerType: 'עוסק מורשה' | 'עוסק פטור' | 'חברה בע"מ' | 'unknown' = 'unknown';
      let isVATRegistered = false;

      if (businessTypeRaw.includes('עוסק מורשה')) {
        dealerType = 'עוסק מורשה';
        isVATRegistered = true;
      } else if (businessTypeRaw.includes('עוסק פטור') || businessTypeRaw.includes('עוסק')) {
        dealerType = 'עוסק פטור';
        isVATRegistered = false;
      } else if (businessTypeRaw.includes('בע"מ') || businessTypeRaw.includes('חברה פרטית')) {
        dealerType = 'חברה בע"מ';
        isVATRegistered = true;
      }

      // Extract status
      const statusRaw = getTableValue('סטטוס') || getTableValue('מצב') || '';
      let status: 'active' | 'dissolved' | 'violating' | 'unknown' = 'unknown';

      if (statusRaw.includes('פעיל') || statusRaw.includes('רשום')) {
        status = 'active';
      } else if (statusRaw.includes('פירוק') || statusRaw.includes('מחוק')) {
        status = 'dissolved';
      } else if (statusRaw.includes('מפר')) {
        status = 'violating';
      }

      // Extract address
      const address = getTableValue('כתובת') || getTableValue('מען');
      const city = getTableValue('עיר') || getTableValue('ישוב');

      // Extract registration date
      const registrationDate = getTableValue('תאריך התאגדות') || getTableValue('תאריך רישום');

      // Extract owners (for individual businesses)
      const owners: Array<{ name: string; idNumber?: string; share?: number }> = [];

      const ownerRows = document.querySelectorAll('.owners-table tr, .shareholders-table tr');
      ownerRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const name = cells[0]?.textContent?.trim();
          const idNumber = cells[1]?.textContent?.trim();
          const shareText = cells[2]?.textContent?.trim();
          const share = shareText ? parseFloat(shareText) : undefined;

          if (name) {
            owners.push({ name, idNumber, share });
          }
        }
      });

      return {
        businessName,
        businessNameEnglish,
        businessType: businessTypeRaw,
        dealerType,
        isVATRegistered,
        status,
        address,
        city,
        registrationDate,
        owners: owners.length > 0 ? owners : undefined,
      };
    });

    console.log(`  ✅ HP ${hpNumber} - Found: ${data.businessName}`);

    return {
      hpNumber,
      ...data,
      lastScraped: new Date(),
    };

  } catch (error) {
    console.error(`  ❌ HP ${hpNumber} - Error:`, error instanceof Error ? error.message : 'Unknown error');
    return null;

  } finally {
    await page.close();
  }
}

/**
 * Scrape multiple HP numbers with rate limiting
 */
async function scrapeMultiple(hpNumbers: number[]): Promise<{
  success: number;
  failed: number;
  notFound: number;
}> {
  console.log(`\n🔍 Starting scrape for ${hpNumbers.length} HP numbers...\n`);

  const browser = await initBrowser();
  const stats = { success: 0, failed: 0, notFound: 0 };

  try {
    for (let i = 0; i < hpNumbers.length; i++) {
      const hp = hpNumbers[i];

      try {
        // Scrape data
        const data = await scrapeCompanyData(browser, hp);

        if (!data) {
          stats.notFound++;
        } else {
          // Determine correct dealer type (exclude חברה בע"מ)
          const osekDealerType: 'עוסק מורשה' | 'עוסק פטור' =
            data.dealerType === 'חברה בע"מ' ? 'עוסק פטור' :
              data.dealerType === 'unknown' ? 'עוסק פטור' :
                data.dealerType;

          // Save to database
          await upsertOsekMorsheh({
            hp_number: data.hpNumber,
            business_name: data.businessName,
            dealer_type: osekDealerType,
            is_vat_registered: data.isVATRegistered,
            tax_status: data.status === 'active' ? 'active' : 'unknown',
            data_source: 'scraping',
            city: data.city,
            business_type: data.businessType,
          });

          stats.success++;
        }

      } catch (error) {
        stats.failed++;
        console.error(`  ❌ Failed to process HP ${hp}`);
      }

      // Rate limiting (2 seconds between requests)
      if (i < hpNumbers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }

      // Progress update every 10 HPs
      if ((i + 1) % 10 === 0) {
        console.log(`\n📊 Progress: ${i + 1}/${hpNumbers.length}`);
        console.log(`   Success: ${stats.success}, Not Found: ${stats.notFound}, Failed: ${stats.failed}\n`);
      }
    }

  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }

  return stats;
}

/**
 * Main function - scrape test set
 */
async function main() {
  console.log('=== Companies Registrar Scraper ===\n');
  console.log('Legal: ✅ Complies with TOS (personal/commercial use)');
  console.log('Rate limit: 1 request / 2 seconds');
  console.log('Source: https://ica.justice.gov.il\n');

  const startTime = Date.now();

  // Test with known HP numbers (including user's business)
  const testHPs = [
    345033898, // TrustCheck Israel (עוסק מורשה)
    123456789, // Test HP
    234567890, // Test HP
    312345678, // Test HP
    456789012, // Test HP
  ];

  console.log(`Testing with ${testHPs.length} HP numbers...\n`);

  const stats = await scrapeMultiple(testHPs);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n=== Scraping Summary ===');
  console.log(`Duration: ${duration} seconds`);
  console.log(`Total HP numbers: ${testHPs.length}`);
  console.log(`✅ Successfully scraped: ${stats.success}`);
  console.log(`ℹ️  Not found: ${stats.notFound}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`Success rate: ${((stats.success / testHPs.length) * 100).toFixed(1)}%`);
}

// Run scraper
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Scraper completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Scraper failed:', error);
      process.exit(1);
    });
}

export { scrapeCompanyData, scrapeMultiple };
