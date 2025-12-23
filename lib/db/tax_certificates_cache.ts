/**
 * Tax Certificates Cache Manager
 * 
 * Manages PostgreSQL cache for tax certificates data:
 * - 7-day TTL (configurable)
 * - Automatic refresh on stale cache
 * - Rate limiting integration
 * 
 * @module lib/db/tax_certificates_cache
 */

import pool from './postgres';
import {
  scrapeTaxCertificates,
  rateLimiter,
  TaxCertificates,
} from '../scrapers/tax_certificates';

const CACHE_TTL_DAYS = 7; // Refresh cache older than 7 days

export interface CachedTaxCertificates extends TaxCertificates {
  _cache: {
    isCached: boolean;
    lastUpdated: string;
    cacheAgeDays: number;
  };
}

/**
 * Get tax certificates with automatic caching
 * 
 * Strategy:
 * 1. Check PostgreSQL cache (< 7 days old)
 * 2. If fresh → return cached data
 * 3. If stale → scrape fresh data → update cache
 * 4. If scrape fails → return stale cache (better than nothing)
 * 
 * @param hpNumber - Israeli company HP number (9 digits)
 * @param options - Fetch options
 * @returns Tax certificates data (cached or fresh)
 * 
 * @example
 * const certs = await getTaxCertificatesWithCache('515972651');
 * console.log(certs._cache.isCached); // true if from cache
 * console.log(certs._cache.cacheAgeDays); // 2.5
 */
export async function getTaxCertificatesWithCache(
  hpNumber: string,
  options: {
    forceRefresh?: boolean; // Skip cache, always scrape fresh
    maxCacheAgeDays?: number; // Override default TTL
  } = {}
): Promise<CachedTaxCertificates> {
  const {
    forceRefresh = false,
    maxCacheAgeDays = CACHE_TTL_DAYS,
  } = options;

  // Check cache first (unless forceRefresh)
  if (!forceRefresh) {
    const cached = await getCachedCertificates(hpNumber, maxCacheAgeDays);
    if (cached) {
      console.log(`[TaxCertificatesCache] ✅ Using cache for HP ${hpNumber} (age: ${cached._cache.cacheAgeDays.toFixed(1)} days)`);
      return cached;
    }
  }

  console.log(`[TaxCertificatesCache] 🔄 Cache miss for HP ${hpNumber}, scraping fresh data...`);

  // Rate limiting (respectful scraping)
  await rateLimiter.wait();

  // Scrape fresh data
  const fresh = await scrapeTaxCertificates(hpNumber);

  // Save to cache
  await saveTaxCertificatesToCache(fresh);

  return {
    ...fresh,
    _cache: {
      isCached: false,
      lastUpdated: fresh._meta.scrapedAt,
      cacheAgeDays: 0,
    },
  };
}

/**
 * Get certificates from PostgreSQL cache
 * @internal
 */
async function getCachedCertificates(
  hpNumber: string,
  maxCacheAgeDays: number
): Promise<CachedTaxCertificates | null> {
  const query = `
    SELECT 
      hp_number,
      company_name,
      vat_file,
      withholding_tax_file,
      bookkeeping_approval,
      bookkeeping_expiration,
      bookkeeping_status,
      withholding_tax_certificates,
      source_url,
      scrape_success,
      scrape_error,
      last_updated,
      EXTRACT(EPOCH FROM (NOW() - last_updated)) / 86400 AS cache_age_days
    FROM tax_certificates
    WHERE hp_number = $1
      AND last_updated > NOW() - INTERVAL '${maxCacheAgeDays} days'
      AND scrape_success = TRUE
  `;

  const result = await pool.query(query, [hpNumber]);

  if (result.rows.length === 0) {
    return null; // Cache miss
  }

  const row = result.rows[0];

  return {
    hpNumber: row.hp_number.toString(),
    companyName: row.company_name,
    vatFile: row.vat_file?.toString() || null,
    withholdingTaxFile: row.withholding_tax_file?.toString() || null,
    bookkeepingApproval: {
      hasApproval: row.bookkeeping_approval,
      expirationDate: row.bookkeeping_expiration?.toISOString() || null,
      status: row.bookkeeping_status,
    },
    withholdingTaxCategories: row.withholding_tax_certificates,
    _meta: {
      sourceUrl: row.source_url,
      scrapedAt: row.last_updated.toISOString(),
      scrapeSuccess: row.scrape_success,
      errorMessage: row.scrape_error,
    },
    _cache: {
      isCached: true,
      lastUpdated: row.last_updated.toISOString(),
      cacheAgeDays: parseFloat(row.cache_age_days),
    },
  };
}

/**
 * Save tax certificates to PostgreSQL cache
 * @internal
 */
async function saveTaxCertificatesToCache(data: TaxCertificates): Promise<void> {
  const query = `
    INSERT INTO tax_certificates (
      hp_number,
      company_name,
      vat_file,
      withholding_tax_file,
      bookkeeping_approval,
      bookkeeping_expiration,
      bookkeeping_status,
      withholding_tax_certificates,
      source_url,
      scrape_success,
      scrape_error,
      last_updated
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    ON CONFLICT (hp_number) DO UPDATE SET
      company_name = EXCLUDED.company_name,
      vat_file = EXCLUDED.vat_file,
      withholding_tax_file = EXCLUDED.withholding_tax_file,
      bookkeeping_approval = EXCLUDED.bookkeeping_approval,
      bookkeeping_expiration = EXCLUDED.bookkeeping_expiration,
      bookkeeping_status = EXCLUDED.bookkeeping_status,
      withholding_tax_certificates = EXCLUDED.withholding_tax_certificates,
      source_url = EXCLUDED.source_url,
      scrape_success = EXCLUDED.scrape_success,
      scrape_error = EXCLUDED.scrape_error,
      last_updated = NOW()
  `;

  const values = [
    parseInt(data.hpNumber),
    data.companyName,
    data.vatFile ? parseInt(data.vatFile) : null,
    data.withholdingTaxFile ? parseInt(data.withholdingTaxFile) : null,
    data.bookkeepingApproval.hasApproval,
    data.bookkeepingApproval.expirationDate,
    data.bookkeepingApproval.status,
    JSON.stringify(data.withholdingTaxCategories),
    data._meta.sourceUrl,
    data._meta.scrapeSuccess,
    data._meta.errorMessage || null,
  ];

  await pool.query(query, values);
  console.log(`[TaxCertificatesCache] 💾 Saved to cache: HP ${data.hpNumber}`);
}

/**
 * Get cache statistics
 * 
 * @returns Cache stats (total companies, fresh/stale counts, etc.)
 * 
 * @example
 * const stats = await getCacheStats();
 * console.log(stats.totalCompanies); // 1543
 * console.log(stats.freshCacheCount); // 1200
 */
export async function getCacheStats(): Promise<{
  totalCompanies: number;
  withBookkeepingApproval: number;
  withoutBookkeepingApproval: number;
  scrapeFailures: number;
  avgCacheAgeDays: number;
  freshCacheCount: number;
  staleCacheCount: number;
}> {
  const query = 'SELECT * FROM tax_certificates_stats';
  const result = await pool.query(query);
  
  if (result.rows.length === 0) {
    return {
      totalCompanies: 0,
      withBookkeepingApproval: 0,
      withoutBookkeepingApproval: 0,
      scrapeFailures: 0,
      avgCacheAgeDays: 0,
      freshCacheCount: 0,
      staleCacheCount: 0,
    };
  }

  const row = result.rows[0];
  return {
    totalCompanies: parseInt(row.total_companies),
    withBookkeepingApproval: parseInt(row.with_bookkeeping_approval),
    withoutBookkeepingApproval: parseInt(row.without_bookkeeping_approval),
    scrapeFailures: parseInt(row.scrape_failures),
    avgCacheAgeDays: parseFloat(row.avg_cache_age_days),
    freshCacheCount: parseInt(row.fresh_cache_count),
    staleCacheCount: parseInt(row.stale_cache_count),
  };
}

/**
 * Bulk refresh stale cache entries
 * 
 * Background job to refresh oldest cache entries.
 * Call from cron job or manual maintenance.
 * 
 * @param limit - Max companies to refresh per run
 * @returns Number of companies refreshed
 * 
 * @example
 * // Cron job: refresh 100 stale entries daily
 * const refreshed = await bulkRefreshStaleCache(100);
 * console.log(`Refreshed ${refreshed} companies`);
 */
export async function bulkRefreshStaleCache(limit: number = 100): Promise<number> {
  console.log(`[TaxCertificatesCache] 🔄 Starting bulk refresh (limit: ${limit})...`);

  // Get stale entries (oldest first)
  const query = `
    SELECT hp_number 
    FROM tax_certificates
    WHERE last_updated <= NOW() - INTERVAL '${CACHE_TTL_DAYS} days'
    ORDER BY last_updated ASC
    LIMIT $1
  `;

  const result = await pool.query(query, [limit]);
  console.log(`[TaxCertificatesCache] Found ${result.rows.length} stale entries`);

  let refreshed = 0;

  for (const row of result.rows) {
    const hpNumber = row.hp_number.toString();

    try {
      // Rate limiting
      await rateLimiter.wait();

      // Scrape fresh data
      const fresh = await scrapeTaxCertificates(hpNumber);

      // Update cache
      await saveTaxCertificatesToCache(fresh);

      refreshed++;
      console.log(`[TaxCertificatesCache] ✅ Refreshed HP ${hpNumber} (${refreshed}/${result.rows.length})`);
    } catch (error) {
      console.error(`[TaxCertificatesCache] ❌ Failed to refresh HP ${hpNumber}:`, error);
      // Continue with next company (don't break loop)
    }
  }

  console.log(`[TaxCertificatesCache] 🎉 Bulk refresh completed: ${refreshed}/${result.rows.length} successful`);
  return refreshed;
}
