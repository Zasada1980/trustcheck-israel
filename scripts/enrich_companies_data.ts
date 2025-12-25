/**
 * Company Data Enrichment Pipeline
 * 
 * Automatically enriches company data from multiple government sources:
 * 1. Companies Registry (data.gov.il) - base data
 * 2. ICA Justice Portal - ownership structure
 * 3. Court data - legal cases
 * 4. Execution proceedings - debts
 * 5. Bank of Israel - account restrictions
 * 6. Tax certificates (if cached) - bookkeeping status
 * 
 * Then calculates bookkeeping risk score for companies without direct data.
 */

import 'dotenv/config';
import { pool } from '../lib/db/postgres';
import { fetchICAOwners, hasSingleOwner, hasOwnerDirector, calculateCompanyAge } from '../lib/scrapers/ica_owners';
import { calculateBookkeepingRisk, RiskFactors } from '../lib/risk_calculator';

interface EnrichmentStats {
  processed: number;
  enriched: number;
  failed: number;
  skipped: number;
}

/**
 * Main enrichment function - processes companies in batches
 */
async function enrichCompaniesData(options: {
  limit?: number;
  batchSize?: number;
  onlyNew?: boolean;
}) {
  const { limit = 1000, batchSize = 100, onlyNew = true } = options;
  
  console.log('🚀 Starting Company Data Enrichment Pipeline...\n');
  console.log(`Settings:`);
  console.log(`  - Limit: ${limit} companies`);
  console.log(`  - Batch size: ${batchSize}`);
  console.log(`  - Only new: ${onlyNew}\n`);
  
  const stats: EnrichmentStats = {
    processed: 0,
    enriched: 0,
    failed: 0,
    skipped: 0,
  };
  
  try {
    // Get companies to enrich
    const whereClause = onlyNew 
      ? "WHERE bookkeeping_risk_score IS NULL"
      : "";
    
    const result = await pool.query(`
      SELECT 
        hp_number,
        company_name,
        violations,
        violations_code,
        company_status,
        registration_date
      FROM companies_registry
      ${whereClause}
      ORDER BY hp_number
      LIMIT $1
    `, [limit]);
    
    const companies = result.rows;
    console.log(`📊 Found ${companies.length} companies to process\n`);
    
    // Process in batches
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, Math.min(i + batchSize, companies.length));
      
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(companies.length / batchSize)}`);
      console.log(`   Companies ${i + 1} to ${Math.min(i + batchSize, companies.length)}`);
      
      await Promise.all(batch.map(company => enrichSingleCompany(company, stats)));
      
      // Rate limiting: wait 2 seconds between batches
      if (i + batchSize < companies.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
  } catch (error) {
    console.error('❌ Pipeline error:', error);
  } finally {
    // Print final statistics
    console.log('\n\n📈 ENRICHMENT COMPLETED\n');
    console.log('Statistics:');
    console.log(`  ✅ Enriched: ${stats.enriched}`);
    console.log(`  ⏭️  Skipped: ${stats.skipped}`);
    console.log(`  ❌ Failed: ${stats.failed}`);
    console.log(`  📊 Total processed: ${stats.processed}`);
    console.log(`  📈 Success rate: ${Math.round((stats.enriched / stats.processed) * 100)}%\n`);
  }
}

/**
 * Enrich single company with data from all sources
 */
async function enrichSingleCompany(company: any, stats: EnrichmentStats): Promise<void> {
  stats.processed++;
  const hpNumber = company.hp_number.toString();
  
  try {
    // Collect all risk factors
    const riskFactors: RiskFactors = {};
    
    // 1. Companies Registry data (already have it)
    riskFactors.violations = company.violations;
    riskFactors.violationsCode = company.violations_code;
    riskFactors.companyStatus = company.company_status;
    
    // 2. Fetch ICA ownership data
    const icaData = await fetchICAOwners(hpNumber);
    if (icaData) {
      riskFactors.hasSingleOwner = hasSingleOwner(icaData);
      riskFactors.hasOwnerDirector = hasOwnerDirector(icaData);
      const age = calculateCompanyAge(icaData.registrationDate);
      if (age !== null) riskFactors.companyAge = age;
    } else {
      // Fallback: calculate age from registry data
      const age = calculateCompanyAge(company.registration_date);
      if (age !== null) riskFactors.companyAge = age;
    }
    
    // 3. Fetch legal cases count
    const legalCasesResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM legal_cases
      WHERE hp_number = $1 AND status = 'active'
    `, [hpNumber]);
    riskFactors.activeLegalCases = parseInt(legalCasesResult.rows[0]?.count || '0');
    
    // 4. Fetch execution proceedings
    const executionResult = await pool.query(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(debt_amount), 0) as total_debt
      FROM execution_proceedings
      WHERE hp_number = $1 AND status = 'active'
    `, [hpNumber]);
    riskFactors.activeExecutionProceedings = parseInt(executionResult.rows[0]?.count || '0');
    riskFactors.totalDebt = parseFloat(executionResult.rows[0]?.total_debt || '0');
    
    // 5. Check bank restrictions (from existing data)
    const mugbalimResult = await pool.query(`
      SELECT is_restricted
      FROM boi_mugbalim_cache
      WHERE hp_number = $1
      ORDER BY last_updated DESC
      LIMIT 1
    `, [hpNumber]);
    riskFactors.hasRestrictedBankAccount = mugbalimResult.rows[0]?.is_restricted || false;
    
    // 6. Check tax certificates (if cached)
    const taxCertResult = await pool.query(`
      SELECT withholding_tax_certificates
      FROM tax_certificates
      WHERE hp_number = $1
    `, [hpNumber]);
    
    if (taxCertResult.rows[0]?.withholding_tax_certificates) {
      const certs = taxCertResult.rows[0].withholding_tax_certificates;
      const issuesCount = Object.values(certs).filter((status: any) => status === 'אין אישור').length;
      riskFactors.hasWithholdingTaxIssues = issuesCount;
    }
    
    // Calculate risk assessment
    const assessment = calculateBookkeepingRisk(riskFactors);
    
    // Save enriched data to database
    await pool.query(`
      UPDATE companies_registry
      SET 
        bookkeeping_risk_score = $1,
        bookkeeping_risk_level = $2,
        bookkeeping_risk_confidence = $3,
        bookkeeping_risk_factors = $4,
        risk_last_updated = NOW()
      WHERE hp_number = $5
    `, [
      assessment.score,
      assessment.level,
      assessment.confidence,
      JSON.stringify(assessment.factors),
      hpNumber,
    ]);
    
    stats.enriched++;
    
    if (assessment.level === 'high' || assessment.level === 'critical') {
      console.log(`  ⚠️  HP ${hpNumber}: Risk ${assessment.score}% (${assessment.level})`);
    }
    
  } catch (error) {
    stats.failed++;
    console.error(`  ❌ Failed to enrich HP ${hpNumber}:`, error);
  }
}

/**
 * Add necessary columns to companies_registry table
 */
async function addRiskColumns() {
  console.log('🔧 Adding risk assessment columns to companies_registry...\n');
  
  try {
    await pool.query(`
      ALTER TABLE companies_registry
      ADD COLUMN IF NOT EXISTS bookkeeping_risk_score INTEGER,
      ADD COLUMN IF NOT EXISTS bookkeeping_risk_level VARCHAR(20),
      ADD COLUMN IF NOT EXISTS bookkeeping_risk_confidence INTEGER,
      ADD COLUMN IF NOT EXISTS bookkeeping_risk_factors JSONB,
      ADD COLUMN IF NOT EXISTS risk_last_updated TIMESTAMP;
      
      CREATE INDEX IF NOT EXISTS idx_bookkeeping_risk_score 
      ON companies_registry(bookkeeping_risk_score);
      
      CREATE INDEX IF NOT EXISTS idx_bookkeeping_risk_level 
      ON companies_registry(bookkeeping_risk_level);
      
      COMMENT ON COLUMN companies_registry.bookkeeping_risk_score IS 
      'Predicted probability (0-100) of missing bookkeeping approval';
      
      COMMENT ON COLUMN companies_registry.bookkeeping_risk_level IS 
      'Risk level: low, medium, high, critical';
    `);
    
    console.log('✅ Database schema updated successfully\n');
  } catch (error) {
    console.error('❌ Failed to update schema:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('═'.repeat(60));
  console.log('  📊 COMPANY DATA ENRICHMENT PIPELINE');
  console.log('═'.repeat(60));
  console.log('\n');
  
  try {
    // Step 1: Update database schema
    await addRiskColumns();
    
    // Step 2: Run enrichment
    await enrichCompaniesData({
      limit: 1000,      // Process 1000 companies
      batchSize: 50,    // 50 companies per batch
      onlyNew: true,    // Only companies without risk score
    });
    
  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n✅ Pipeline completed. Database connection closed.\n');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { enrichCompaniesData, addRiskColumns };
