/**
 * Enrich Companies with VAT Dealer Status
 * 
 * Batch process to enrich companies_registry with:
 * - עוסק מורשה/פטור status
 * - VAT registration number
 * - Bookkeeping approval status (ניהול ספרים)
 */

import 'dotenv/config';
import { enrichCompaniesWithVATStatus } from '../lib/vat_dealer';

interface EnrichmentOptions {
  limit?: number;
  onlyMissing?: boolean;
}

async function main() {
  console.log('🚀 Starting VAT Dealer Enrichment...\n');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='));
  const allArg = args.find(a => a === '--all');
  
  const options: EnrichmentOptions = {
    limit: allArg ? undefined : (limitArg ? parseInt(limitArg.split('=')[1]) : 1000),  // Default: 1000 companies, --all = no limit
    onlyMissing: true,  // Always only enrich missing records
  };
  
  console.log(`Settings:`);
  console.log(`  - Limit: ${options.limit ?? 'ALL companies'}`);
  console.log(`  - Only missing: ${options.onlyMissing}\n`);
  
  try {
    const startTime = Date.now();
    
    // Run enrichment
    const stats = await enrichCompaniesWithVATStatus(options);
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n✅ Enrichment Complete!');
    console.log(`  - Processed: ${stats.processed}`);
    console.log(`  - Enriched: ${stats.enriched}`);
    console.log(`  - Failed: ${stats.failed}`);
    console.log(`  - Duration: ${duration}s`);
    console.log(`  - Rate: ${Math.round(stats.processed / duration)} companies/sec`);
    
  } catch (error) {
    console.error('❌ Enrichment failed:', error);
    process.exit(1);
  }
}

main();
