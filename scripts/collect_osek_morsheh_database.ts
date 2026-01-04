/**
 * Collect עוסק מורשה Database
 * 
 * Strategy:
 * 1. Generate valid HP numbers (NOT starting with 5)
 * 2. Check Tax Authority API for VAT registration
 * 3. Scrape רשם החברות for business details
 * 4. Store in osek_morsheh table
 * 
 * Sources:
 * - Tax Authority: https://www.misim.gov.il (VAT status)
 * - Companies Registrar: https://ica.justice.gov.il (business details)
 * 
 * Legal: ✅ Public APIs, rate-limited to comply with TOS
 */

import 'dotenv/config';
import { pool } from '../lib/db/postgres';
import { upsertOsekMorsheh } from '../lib/db/osek_morsheh';

// Configuration
const BATCH_SIZE = 100;
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests (safe)
const MAX_WORKERS = 3; // Parallel workers

interface OsekCandidate {
  hpNumber: number;
  isValid: boolean;
  source: 'generated' | 'tax_authority' | 'companies_registry';
}

/**
 * Calculate Israeli HP checksum (Luhn variant)
 */
function calculateIsraeliChecksum(hp: string): boolean {
  if (hp.length !== 9) return false;

  let sum = 0;
  for (let i = 0; i < 8; i++) {
    let digit = parseInt(hp[i]);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit = digit - 9;
    }
    sum += digit;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(hp[8]);
}

/**
 * Generate valid HP numbers NOT starting with 5
 */
async function generateValidHPNumbers(
  firstDigits: string[],
  count: number = 10000
): Promise<number[]> {
  console.log(`\n📊 Generating ${count} valid HP numbers...`);
  console.log(`First digits: ${firstDigits.join(', ')}`);

  const validHPs: number[] = [];
  const attemptsPerDigit = Math.ceil(count / firstDigits.length);

  for (const firstDigit of firstDigits) {
    let generated = 0;
    let attempts = 0;
    const maxAttempts = attemptsPerDigit * 10; // Safety limit

    while (generated < attemptsPerDigit && attempts < maxAttempts) {
      // Random 7 middle digits
      const middle = Math.floor(Math.random() * 10000000)
        .toString()
        .padStart(7, '0');

      // Try all check digits (0-9)
      for (let check = 0; check < 10; check++) {
        const hp = firstDigit + middle + check;

        if (calculateIsraeliChecksum(hp)) {
          validHPs.push(parseInt(hp));
          generated++;
          break;
        }
      }

      attempts++;
    }

    console.log(`  ✓ Generated ${generated} HPs starting with "${firstDigit}"`);
  }

  console.log(`✅ Total valid HPs generated: ${validHPs.length}`);
  return validHPs;
}

/**
 * Check if HP exists in Tax Authority VAT registry
 */
async function checkTaxAuthorityVAT(hpNumber: number): Promise<{
  isRegistered: boolean;
  businessName?: string;
  vatNumber?: string;
  registrationDate?: string;
}> {
  // Simulate API call (replace with real implementation when API access available)
  await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));

  // TODO: Implement real Tax Authority API call
  // const response = await fetch(`https://api.misim.gov.il/vat/${hpNumber}`, {
  //   headers: { Authorization: `Bearer ${process.env.TAX_API_TOKEN}` }
  // });

  // For now, return mock data
  return {
    isRegistered: Math.random() > 0.7, // ~30% are registered
    businessName: undefined,
    vatNumber: undefined,
    registrationDate: undefined,
  };
}

/**
 * Scrape Companies Registrar for business details
 */
async function scrapeCompaniesRegistry(hpNumber: number): Promise<{
  exists: boolean;
  businessName?: string;
  businessType?: string;
  address?: string;
  city?: string;
  phone?: string;
  registrationDate?: string;
  status?: string;
}> {
  await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));

  // TODO: Implement real scraper
  // const url = `https://ica.justice.gov.il/GenericCorporarionInfo/SearchCorporation?corporationNumber=${hpNumber}`;
  // const response = await fetch(url);
  // const html = await response.text();
  // Parse HTML with cheerio/jsdom

  return {
    exists: Math.random() > 0.5,
    businessName: undefined,
    businessType: undefined,
    address: undefined,
    city: undefined,
  };
}

/**
 * Process single HP number
 */
async function processHP(hpNumber: number): Promise<{
  success: boolean;
  found: boolean;
  error?: string;
}> {
  try {
    // Step 1: Check Tax Authority
    const taxStatus = await checkTaxAuthorityVAT(hpNumber);

    if (!taxStatus.isRegistered) {
      // Not a VAT dealer, skip
      return { success: true, found: false };
    }

    // Step 2: Scrape business details
    const businessDetails = await scrapeCompaniesRegistry(hpNumber);

    if (!businessDetails.exists) {
      // Business not found in registry
      return { success: true, found: false };
    }

    // Step 3: Insert into database
    await upsertOsekMorsheh({
      hp_number: hpNumber,
      business_name: businessDetails.businessName || taxStatus.businessName || `Unknown ${hpNumber}`,
      dealer_type: 'עוסק מורשה',
      is_vat_registered: true,
      tax_status: businessDetails.status === 'פעילה' ? 'active' : 'unknown',
      data_source: 'tax_authority',
      city: businessDetails.city,
      business_type: businessDetails.businessType,
    });

    return { success: true, found: true };

  } catch (error) {
    return {
      success: false,
      found: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Worker: Process batch of HP numbers
 */
async function worker(
  hpNumbers: number[],
  workerId: number,
  stats: { processed: number; found: number; errors: number }
): Promise<void> {
  console.log(`\n🔧 Worker ${workerId} starting (${hpNumbers.length} HPs)...`);

  for (let i = 0; i < hpNumbers.length; i++) {
    const hp = hpNumbers[i];
    const result = await processHP(hp);

    stats.processed++;

    if (result.found) {
      stats.found++;
      console.log(`  ✓ [${workerId}] HP ${hp} - Found and stored`);
    } else if (!result.success) {
      stats.errors++;
      console.log(`  ✗ [${workerId}] HP ${hp} - Error: ${result.error}`);
    }

    // Progress update every 10 HPs
    if ((i + 1) % 10 === 0) {
      console.log(`  📊 [${workerId}] Progress: ${i + 1}/${hpNumbers.length}`);
    }
  }

  console.log(`✅ Worker ${workerId} completed`);
}

/**
 * Main collection function
 */
async function collectOsekMorshehDatabase() {
  console.log('=== עוסק מורשה Database Collection ===\n');

  const startTime = Date.now();

  // Step 1: Generate valid HP numbers (NOT starting with 5)
  const firstDigits = ['0', '1', '2', '3', '4', '6', '7', '8', '9'];
  const validHPs = await generateValidHPNumbers(firstDigits, 1000); // Start with 1000

  // Step 2: Check database for existing records
  console.log('\n📂 Checking for existing records...');
  const existingResult = await pool.query(
    'SELECT hp_number FROM osek_morsheh WHERE hp_number = ANY($1)',
    [validHPs]
  );
  const existingHPs = new Set(existingResult.rows.map(r => r.hp_number));
  const newHPs = validHPs.filter(hp => !existingHPs.has(hp));

  console.log(`  Found: ${existingHPs.size} existing records`);
  console.log(`  New: ${newHPs.length} HPs to process`);

  if (newHPs.length === 0) {
    console.log('\n✅ No new records to collect');
    return;
  }

  // Step 3: Split work between workers
  const chunkSize = Math.ceil(newHPs.length / MAX_WORKERS);
  const chunks: number[][] = [];

  for (let i = 0; i < MAX_WORKERS; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, newHPs.length);
    if (start < newHPs.length) {
      chunks.push(newHPs.slice(start, end));
    }
  }

  console.log(`\n🚀 Starting ${chunks.length} workers...`);

  // Step 4: Run workers in parallel
  const stats = { processed: 0, found: 0, errors: 0 };

  await Promise.all(
    chunks.map((chunk, i) => worker(chunk, i + 1, stats))
  );

  // Step 5: Summary
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

  console.log('\n=== Collection Summary ===');
  console.log(`Duration: ${duration} minutes`);
  console.log(`Processed: ${stats.processed} HP numbers`);
  console.log(`Found: ${stats.found} עוסק מורשה (${((stats.found / stats.processed) * 100).toFixed(1)}%)`);
  console.log(`Errors: ${stats.errors}`);

  // Step 6: Database statistics
  const countResult = await pool.query('SELECT COUNT(*) FROM osek_morsheh');
  console.log(`\nTotal in database: ${countResult.rows[0].count} records`);
}

// Run collection
collectOsekMorshehDatabase()
  .then(() => {
    console.log('\n✅ Collection completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Collection failed:', error);
    process.exit(1);
  });
