/**
 * AI-Optimized PostgreSQL Client
 * 
 * Purpose: Easy-to-read database interface for AI/LLM analysis
 * 
 * Key Features:
 * - Simplified data structures (boolean flags, enums, pre-calculated scores)
 * - Single-query access via materialized views
 * - Built-in caching layer (ai_analysis_cache table)
 * - JSON export for AI model consumption
 * 
 * Usage:
 *   const profile = await getAIBusinessProfile(515044532);
 *   const riskScore = await getRiskIndicators(515044532);
 *   const summary = await getBusinessSummary(515044532);
 */

import { Pool } from 'pg';

// Use existing pool configuration
export const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'trustcheck_gov_data',
  user: process.env.POSTGRES_USER || 'trustcheck_admin',
  password: process.env.POSTGRES_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// ============================================
// TYPE DEFINITIONS (AI-Friendly)
// ============================================

export interface AIBusinessProfile {
  // Identity
  businessId: number;
  businessName: string;
  businessNameEn?: string;
  businessNameClean: string;

  // Type
  businessCategory: 'company' | 'osek_morsheh' | 'osek_patur';
  businessTypeFull: string;
  businessTypeCode?: number;

  // Status (Clear boolean)
  isActive: boolean;
  statusText: 'active' | 'liquidation' | 'bankrupt' | 'dissolved';
  statusReason?: string;
  statusSince?: Date;

  // Dates
  registrationDate?: Date;
  registrationAgeDays?: number;
  lastAnnualReportYear?: number;
  yearsSinceReport?: number;

  // Compliance (Boolean flags)
  isGovernmentOwned: boolean;
  hasViolations: boolean;
  violationType?: string;
  hasLimitations: boolean;
  limitationType?: string;

  // Address
  addressFull?: string;
  addressCity?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressZipcode?: string;

  // Purpose
  purposeText?: string;
  purposeKeywords?: string[];

  // Metadata
  dataCompletenessScore: number;  // 0-100
  dataSource: string;
  dataLastUpdated: Date;
}

export interface AIRiskIndicators {
  businessId: number;

  // Overall Risk (0-100, higher = more risk)
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskSummary: string;

  // Financial Risk
  financialRiskScore: number;
  hasBankRestrictions: boolean;
  bankRestrictionDate?: Date;
  hasTaxDebt: boolean;
  taxDebtAmount: number;
  hasExecutionProceedings: boolean;
  executionDebtAmount: number;

  // Legal Risk
  legalRiskScore: number;
  activeLawsuitsCount: number;
  totalLawsuitsCount: number;
  criminalCasesCount: number;
  lastLawsuitDate?: Date;

  // Operational Risk
  operationalRiskScore: number;
  isNewBusiness: boolean;
  missingAnnualReports: boolean;
  hasRegulatoryViolations: boolean;

  // Trust Indicators (Positive)
  positiveIndicatorsCount: number;
  hasValidTaxCertificate: boolean;
  hasRecentAnnualReport: boolean;
  businessLongevityYears: number;

  // AI Recommendation
  recommendedAction?: string;

  // Metadata
  calculatedAt: Date;
  calculationVersion: string;
}

export interface AIBusinessSummary {
  // Basic Info
  businessId: number;
  businessName: string;
  businessCategory: string;
  isActive: boolean;
  statusText: string;
  registrationAgeDays?: number;
  addressCity?: string;

  // Risk Scores
  overallRiskScore: number;
  riskLevel: string;
  financialRiskScore: number;
  legalRiskScore: number;
  operationalRiskScore: number;

  // Flags
  hasBankRestrictions: boolean;
  hasTaxDebt: boolean;
  hasExecutionProceedings: boolean;
  hasViolations: boolean;

  // Counts
  activeLawsuitsCount: number;
  totalLegalCases: number;
  positiveIndicatorsCount: number;

  // Financial
  totalActiveDebt: number;
  activeBankRestrictions: number;

  // Compliance
  lastAnnualReportYear?: number;
  validTaxCerts: number;

  // Cached Analysis
  trustScore?: number;
  trustLevel?: string;
  summaryHebrew?: string;
  strengthsCount: number;
  risksCount: number;
  analysisDate?: Date;

  // Metadata
  dataCompletenessScore: number;
  dataLastUpdated: Date;
}

export interface AICachedAnalysis {
  businessId: number;
  trustScore: number;  // 1.0-5.0
  trustLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  summaryHebrew: string;
  summaryEnglish?: string;
  strengths: string[];
  risks: string[];
  recommendations: string[];
  recommendationsPriority: 'low' | 'medium' | 'high';
  modelName: string;
  generatedAt: Date;
  expiresAt: Date;
  isStale: boolean;
  generationTimeMs?: number;
}

// ============================================
// QUERY FUNCTIONS (AI-Optimized)
// ============================================

/**
 * Get complete business profile (single query)
 * Fast: < 50ms for cached data
 */
export async function getAIBusinessProfile(businessId: number): Promise<AIBusinessProfile | null> {
  try {
    const query = `
      SELECT 
        business_id as "businessId",
        business_name as "businessName",
        business_name_en as "businessNameEn",
        business_name_clean as "businessNameClean",
        business_category as "businessCategory",
        business_type_full as "businessTypeFull",
        business_type_code as "businessTypeCode",
        is_active as "isActive",
        status_text as "statusText",
        status_reason as "statusReason",
        status_since as "statusSince",
        registration_date as "registrationDate",
        registration_age_days as "registrationAgeDays",
        last_annual_report_year as "lastAnnualReportYear",
        years_since_report as "yearsSinceReport",
        is_government_owned as "isGovernmentOwned",
        has_violations as "hasViolations",
        violation_type as "violationType",
        has_limitations as "hasLimitations",
        limitation_type as "limitationType",
        address_full as "addressFull",
        address_city as "addressCity",
        address_street as "addressStreet",
        address_number as "addressNumber",
        address_zipcode as "addressZipcode",
        purpose_text as "purposeText",
        purpose_keywords as "purposeKeywords",
        data_completeness_score as "dataCompletenessScore",
        data_source as "dataSource",
        data_last_updated as "dataLastUpdated"
      FROM ai_business_profiles
      WHERE business_id = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [businessId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching AI business profile:', error);
    throw error;
  }
}

/**
 * Get risk indicators (pre-calculated scores)
 * Fast: < 30ms
 */
export async function getRiskIndicators(businessId: number): Promise<AIRiskIndicators | null> {
  try {
    const query = `
      SELECT 
        business_id as "businessId",
        overall_risk_score as "overallRiskScore",
        risk_level as "riskLevel",
        risk_summary as "riskSummary",
        financial_risk_score as "financialRiskScore",
        has_bank_restrictions as "hasBankRestrictions",
        bank_restriction_date as "bankRestrictionDate",
        has_tax_debt as "hasTaxDebt",
        tax_debt_amount as "taxDebtAmount",
        has_execution_proceedings as "hasExecutionProceedings",
        execution_debt_amount as "executionDebtAmount",
        legal_risk_score as "legalRiskScore",
        active_lawsuits_count as "activeLawsuitsCount",
        total_lawsuits_count as "totalLawsuitsCount",
        criminal_cases_count as "criminalCasesCount",
        last_lawsuit_date as "lastLawsuitDate",
        operational_risk_score as "operationalRiskScore",
        is_new_business as "isNewBusiness",
        missing_annual_reports as "missingAnnualReports",
        has_regulatory_violations as "hasRegulatoryViolations",
        positive_indicators_count as "positiveIndicatorsCount",
        has_valid_tax_certificate as "hasValidTaxCertificate",
        has_recent_annual_report as "hasRecentAnnualReport",
        business_longevity_years as "businessLongevityYears",
        recommended_action as "recommendedAction",
        calculated_at as "calculatedAt",
        calculation_version as "calculationVersion"
      FROM ai_risk_indicators
      WHERE business_id = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [businessId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching risk indicators:', error);
    throw error;
  }
}

/**
 * Get consolidated business summary (materialized view)
 * Fastest: < 20ms (includes all joined data)
 */
export async function getBusinessSummary(businessId: number): Promise<AIBusinessSummary | null> {
  try {
    const query = `
      SELECT 
        business_id as "businessId",
        business_name as "businessName",
        business_category as "businessCategory",
        is_active as "isActive",
        status_text as "statusText",
        registration_age_days as "registrationAgeDays",
        has_violations as "hasViolations",
        address_city as "addressCity",
        overall_risk_score as "overallRiskScore",
        risk_level as "riskLevel",
        financial_risk_score as "financialRiskScore",
        legal_risk_score as "legalRiskScore",
        operational_risk_score as "operationalRiskScore",
        has_bank_restrictions as "hasBankRestrictions",
        has_tax_debt as "hasTaxDebt",
        has_execution_proceedings as "hasExecutionProceedings",
        active_lawsuits_count as "activeLawsuitsCount",
        positive_indicators_count as "positiveIndicatorsCount",
        total_active_debt as "totalActiveDebt",
        active_bank_restrictions as "activeBankRestrictions",
        open_legal_cases as "openLegalCases",
        total_legal_cases as "totalLegalCases",
        last_annual_report_year as "lastAnnualReportYear",
        valid_tax_certs as "validTaxCerts",
        trust_score as "trustScore",
        trust_level as "trustLevel",
        summary_hebrew as "summaryHebrew",
        strengths_count as "strengthsCount",
        risks_count as "risksCount",
        analysis_date as "analysisDate",
        data_completeness_score as "dataCompletenessScore",
        data_last_updated as "dataLastUpdated"
      FROM ai_business_summary
      WHERE business_id = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [businessId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching business summary:', error);
    throw error;
  }
}

/**
 * Get cached AI analysis (avoid re-generating reports)
 * Check cache first before calling Gemini API
 */
export async function getCachedAnalysis(businessId: number): Promise<AICachedAnalysis | null> {
  try {
    const query = `
      SELECT 
        business_id as "businessId",
        trust_score as "trustScore",
        trust_level as "trustLevel",
        summary_hebrew as "summaryHebrew",
        summary_english as "summaryEnglish",
        strengths,
        risks,
        recommendations,
        recommendations_priority as "recommendationsPriority",
        model_name as "modelName",
        generated_at as "generatedAt",
        expires_at as "expiresAt",
        is_stale as "isStale",
        generation_time_ms as "generationTimeMs"
      FROM ai_analysis_cache
      WHERE business_id = $1
        AND is_stale = false  -- Only return fresh cache
      LIMIT 1
    `;

    const result = await pool.query(query, [businessId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching cached analysis:', error);
    return null;  // Return null on error (fallback to fresh generation)
  }
}

/**
 * Save AI-generated analysis to cache
 * TTL: 7 days by default
 */
export async function saveCachedAnalysis(
  businessId: number,
  analysis: {
    trustScore: number;
    trustLevel: string;
    summaryHebrew: string;
    summaryEnglish?: string;
    strengths: string[];
    risks: string[];
    recommendations: string[];
    recommendationsPriority: string;
    modelName: string;
    generationTimeMs?: number;
  }
): Promise<void> {
  try {
    const query = `
      INSERT INTO ai_analysis_cache (
        business_id,
        trust_score,
        trust_level,
        summary_hebrew,
        summary_english,
        strengths,
        risks,
        recommendations,
        recommendations_priority,
        model_name,
        generation_time_ms,
        strengths_count,
        risks_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (business_id) DO UPDATE SET
        trust_score = EXCLUDED.trust_score,
        trust_level = EXCLUDED.trust_level,
        summary_hebrew = EXCLUDED.summary_hebrew,
        summary_english = EXCLUDED.summary_english,
        strengths = EXCLUDED.strengths,
        risks = EXCLUDED.risks,
        recommendations = EXCLUDED.recommendations,
        recommendations_priority = EXCLUDED.recommendations_priority,
        model_name = EXCLUDED.model_name,
        generation_time_ms = EXCLUDED.generation_time_ms,
        strengths_count = EXCLUDED.strengths_count,
        risks_count = EXCLUDED.risks_count,
        generated_at = CURRENT_TIMESTAMP,
        expires_at = CURRENT_TIMESTAMP + INTERVAL '7 days',
        view_count = 0
    `;

    await pool.query(query, [
      businessId,
      analysis.trustScore,
      analysis.trustLevel,
      analysis.summaryHebrew,
      analysis.summaryEnglish || null,
      analysis.strengths,
      analysis.risks,
      analysis.recommendations,
      analysis.recommendationsPriority,
      analysis.modelName,
      analysis.generationTimeMs || null,
      analysis.strengths.length,
      analysis.risks.length
    ]);
  } catch (error) {
    console.error('Error saving cached analysis:', error);
    // Don't throw - cache save failure should not break app
  }
}

/**
 * Get complete profile as JSON (for AI model consumption)
 * Uses PostgreSQL function: get_ai_business_profile()
 */
export async function getAIBusinessProfileJSON(businessId: number): Promise<any> {
  try {
    const query = `SELECT get_ai_business_profile($1) as profile`;
    const result = await pool.query(query, [businessId]);
    return result.rows[0]?.profile || null;
  } catch (error) {
    console.error('Error fetching AI business profile JSON:', error);
    throw error;
  }
}

/**
 * Search businesses by name (fuzzy search)
 * Uses trigram similarity for Hebrew text
 */
export async function searchBusinessesByName(
  searchTerm: string,
  limit: number = 10
): Promise<AIBusinessSummary[]> {
  try {
    const cleanTerm = searchTerm.toLowerCase().trim();

    const query = `
      SELECT 
        business_id as "businessId",
        business_name as "businessName",
        business_category as "businessCategory",
        is_active as "isActive",
        address_city as "addressCity",
        overall_risk_score as "overallRiskScore",
        risk_level as "riskLevel",
        trust_score as "trustScore",
        data_completeness_score as "dataCompletenessScore",
        similarity(business_name_clean, $1) as similarity_score
      FROM ai_business_summary
      WHERE business_name_clean % $1  -- Trigram similarity operator
      ORDER BY similarity(business_name_clean, $1) DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [cleanTerm, limit]);
    return result.rows;
  } catch (error) {
    console.error('Error searching businesses:', error);
    return [];
  }
}

/**
 * Get high-risk businesses (for monitoring)
 */
export async function getHighRiskBusinesses(limit: number = 100): Promise<AIBusinessSummary[]> {
  try {
    const query = `
      SELECT * FROM ai_business_summary
      WHERE risk_level IN ('high', 'critical')
        AND is_active = true
      ORDER BY overall_risk_score DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching high-risk businesses:', error);
    return [];
  }
}

/**
 * Increment cache view count (analytics)
 */
export async function incrementCacheViewCount(businessId: number): Promise<void> {
  try {
    const query = `
      UPDATE ai_analysis_cache
      SET view_count = view_count + 1,
          last_viewed_at = CURRENT_TIMESTAMP
      WHERE business_id = $1
    `;

    await pool.query(query, [businessId]);
  } catch (error) {
    console.error('Error incrementing view count:', error);
    // Don't throw - analytics failure should not break app
  }
}

/**
 * Refresh materialized view (run periodically via cron)
 */
export async function refreshBusinessSummaryView(): Promise<void> {
  try {
    await pool.query('SELECT refresh_business_summary()');
    console.log('✅ Materialized view refreshed successfully');
  } catch (error) {
    console.error('Error refreshing materialized view:', error);
    throw error;
  }
}
