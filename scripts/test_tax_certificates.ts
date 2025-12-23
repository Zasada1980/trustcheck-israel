/**
 * Tax Certificates Integration - Test Script
 * 
 * Manual test for tax certificates scraper + cache
 * Run: tsx scripts/test_tax_certificates.ts
 */

import { scrapeTaxCertificates } from '../lib/scrapers/tax_certificates';
import { getTaxCertificatesWithCache, getCacheStats } from '../lib/db/tax_certificates_cache';

async function testTaxCertificates() {
  console.log('🧪 Testing Tax Certificates Integration...\n');

  // Test 1: Cache stats
  console.log('📊 Test 1: Cache Statistics');
  const stats = await getCacheStats();
  console.log(stats);
  console.log('');

  // Test 2: Get cached data (should exist from SQL init)
  console.log('📦 Test 2: Get Cached Data (HP 515972651)');
  try {
    const cached = await getTaxCertificatesWithCache('515972651');
    console.log('✅ Cache hit:', cached._cache.isCached);
    console.log('Company:', cached.companyName);
    console.log('Bookkeeping approval:', cached.bookkeepingApproval.status);
    console.log('Cache age:', cached._cache.cacheAgeDays.toFixed(2), 'days');
  } catch (error) {
    console.error('❌ Error:', error);
  }
  console.log('');

  // Test 3: Force refresh (scrape fresh data)
  console.log('🔄 Test 3: Force Refresh (Scraping - SKIP FOR NOW)');
  console.log('⏭️  Skipping live scraping test (requires manual verification)');
  console.log('');

  // Test 4: Test with unknown company (should attempt scrape)
  console.log('🆕 Test 4: Unknown Company (HP 510000334)');
  try {
    const fresh = await getTaxCertificatesWithCache('510000334');
    console.log('✅ Fetch result:', fresh._meta.scrapeSuccess ? 'success' : 'failed');
    console.log('Company:', fresh.companyName);
    console.log('Bookkeeping approval:', fresh.bookkeepingApproval.status);
  } catch (error) {
    console.error('❌ Error:', error);
  }
  console.log('');

  console.log('🎉 Tests completed!');
}

// Run tests
testTaxCertificates().catch(console.error);
