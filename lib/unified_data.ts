/**
 * Unified Data Service - Government Sources Integration
 * 
 * This module combines data from:
 * 1. PostgreSQL cache (data.gov.il datasets)
 * 2. Real-time scraping (ica.justice.gov.il)
 * 3. Court data (court.gov.il)
 * 4. Bank of Israel (Mugbalim restricted accounts)
 * 5. Tax Authority (VAT/Maam status)
 * 6. Execution Office (Hotzaa LaPoal debt proceedings)
 * 7. Fallback to CheckID mock data
 * 
 * Strategy:
 * - First try local PostgreSQL (fast, cached)
 * - Parallel fetch from all free government sources
 * - If scraping fails → fallback to mock data
 */

import {
  searchLocalCompany,
  getCompanyLegalCases,
  getCompanyExecutionProceedings,
  upsertCompany,
  upsertCompanyOwners,
  isCompanyDataOutdated,
  logScrapingOperation,
  checkDatabaseHealth,
  type CompanyProfile,
  type LegalCase,
  type ExecutionProceeding,
} from './db/postgres';

import { getMockBusinessData, type CheckIDBusinessData } from './checkid';

// New CheckID-equivalent free sources
import { checkMugbalimStatus, type MugbalimCheckResult } from './boi_mugbalim';
import { checkTaxStatus, type TaxStatus } from './tax_authority';
import { searchLegalCases, type CourtSearchResult } from './courts_scraper';
import { searchExecutionProceedings, type ExecutionSearchResult } from './execution_office';
import { getTaxCertificatesWithCache, type CachedTaxCertificates } from './db/tax_certificates_cache';

// NEW: Risk assessment for bookkeeping
import { calculateBookkeepingRisk, type RiskFactors, type RiskAssessment } from './risk_calculator';
import { fetchICAOwners, hasSingleOwner, hasOwnerDirector, calculateCompanyAge } from './scrapers/ica_owners';

// NEW: VAT Dealer verification
import { getVATDealerStatus, type VATDealerStatus } from './vat_dealer';

// NEW: Osek Morsheh verification (individual businesses)
import { getOsekMorsheh, classifyByHPNumber, type OsekMorsheh, type Classification } from './db/osek_morsheh';

// Types for unified API
export interface UnifiedBusinessData {
  // Basic Info (from PostgreSQL or scraping)
  hpNumber: string;
  nameHebrew: string;
  nameEnglish?: string;
  companyType: string;
  status: string;
  registrationDate?: string;
  
  // Regulatory Compliance
  violations?: string;  // "מפרה" if company violates laws
  violationsCode?: string;  // Code 18 = violating company
  limitations?: string;  // "מוגבלת" or other limitations
  governmentCompany?: string;  // "כן" if government-owned
  lastAnnualReport?: string;  // Last annual report year
  businessDescription?: string;  // תאור עיסוק
  
  // Address
  address: {
    street?: string;
    city?: string;
    zipcode?: string;
  };
  
  // Contact
  phone?: string;
  website?: string;
  email?: string;
  
  // Owners (from PostgreSQL or ICA scraping)
  owners: Array<{
    name: string;
    role: string;
    sharePercentage?: number;
  }>;
  
  // Legal Issues (from PostgreSQL or Court scraping)
  legalIssues: {
    activeCases: number;
    totalCases: number;
    executionProceedings: number;
    totalDebt: number;
    recentCases: Array<{
      caseNumber: string;
      caseType: string;
      status: string;
      filingDate?: string;
    }>;
  };
  
  // NEW: Tax & Regulatory Status
  taxStatus?: {
    isMaamRegistered: boolean;      // עוסק מורשה
    isMaamExempt: boolean;          // עוסק פטור
    maamNumber?: string;
    hasNikuiBamakor: boolean;       // ניכוי במקור
    lastVerified: string;
  };
  
  // NEW: Tax Certificates (ניהול ספרים + ניכוי מס במקור)
  taxCertificates?: {
    bookkeepingApproval: {
      hasApproval: boolean;
      expirationDate: string | null;
      status: 'יש אישור' | 'אין אישור' | 'לא ידוע';
    };
    withholdingTax: {
      services: 'עפ\'\'י תקנות מ\'\'ה' | 'אין אישור' | 'לא ידוע';
      construction: 'עפ\'\'י תקנות מ\'\'ה' | 'אין אישור' | 'לא ידוע';
      securityCleaning: 'עפ\'\'י תקנות מ\'\'ה' | 'אין אישור' | 'לא ידוע';
      production: 'עפ\'\'י תקנות מ\'\'ה' | 'אין אישור' | 'לא ידוע';
      consulting: 'עפ\'\'י תקנות מ\'\'ה' | 'אין אישור' | 'לא ידוע';
      planningAdvertising: 'עפ\'\'י תקנות מ\'\'ה' | 'אין אישור' | 'לא ידוע';
      itServices: 'עפ\'\'י תקנות מ\'\'ה' | 'אין אישור' | 'לא ידוע';
      insurancePension: 'עפ\'\'י תקנות מ\'\'ה' | 'אין אישור' | 'לא ידוע';
    };
    _meta: {
      lastUpdated: string;
      cacheAgeDays: number;
      source: 'taxinfo.taxes.gov.il';
    };
  };
  
  // NEW: Bank of Israel Restrictions
  bankingStatus?: {
    hasRestrictedAccount: boolean;  // חשבון מוגבל
    restrictionDate?: string;
    restrictionDetails?: string[];
  };
  
  // Industry & Business Info
  industry?: string;
  businessPurpose?: string;
  
  // Risk Indicators (calculated)
  riskIndicators: {
    hasActiveLegalCases: boolean;
    hasExecutionProceedings: boolean;
    isCompanyViolating: boolean;
    hasHighDebt: boolean;
    hasRestrictedBankAccount: boolean;  // NEW
    hasBankruptcyProceedings: boolean;  // NEW
    hasNoBookkeepingApproval: boolean;  // NEW: אין אישור ניהול ספרים
    hasLimitedWithholdingTaxApprovals: boolean;  // NEW: < 4 ניכוי מס approvals
  };
  
  // NEW: Bookkeeping Risk Assessment (when exact data unavailable)
  bookkeepingRisk?: {
    score: number;  // 0-100
    level: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;  // 0-100 (data completeness)
    factors: Array<{
      name: string;
      impact: number;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
    recommendation: string;
    calculatedAt: string;
  };
  
  // Metadata
  dataSource: 'postgresql' | 'ica_scraping' | 'court_scraping' | 'mock_data';
  dataQuality: 'high' | 'medium' | 'low';
  lastUpdated: string;
  cacheHit: boolean;
}

/**
 * Main function to get business data
 * Implements hybrid strategy: PostgreSQL → Parallel Gov Sources → Mock
 */
export async function getBusinessData(
  hpNumber: string,
  options: {
    forceRefresh?: boolean;  // Force scraping even if cached
    includeLegal?: boolean;   // Include legal cases (slower)
    includeAllSources?: boolean;  // Include all CheckID-equivalent sources
    businessName?: string;    // CRITICAL FIX: Original business name from user query
  } = {}
): Promise<UnifiedBusinessData | null> {
  
  const startTime = Date.now();
  let dataSource: UnifiedBusinessData['dataSource'] = 'mock_data';
  let cacheHit = false;
  
  try {
    // Step 1: Check PostgreSQL cache
    if (!options.forceRefresh) {
      console.log(`[UnifiedData] Checking PostgreSQL for HP ${hpNumber}...`);
      
      const cachedCompany = await searchLocalCompany(hpNumber);
      
      if (cachedCompany) {
        const isOutdated = await isCompanyDataOutdated(hpNumber);
        
        if (!isOutdated) {
          console.log(`[UnifiedData] Cache HIT - Using PostgreSQL data`);
          
          // Get legal data if requested
          let legalCases: LegalCase[] = [];
          let executionProcs: ExecutionProceeding[] = [];
          
          if (options.includeLegal) {
            [legalCases, executionProcs] = await Promise.all([
              getCompanyLegalCases(hpNumber),
              getCompanyExecutionProceedings(hpNumber),
            ]);
          }
          
          // NEW: Fetch all CheckID-equivalent sources in parallel
          let mugbalimResult: MugbalimCheckResult | null = null;
          let taxStatus: TaxStatus | null = null;
          let courtCases: CourtSearchResult | null = null;
          let executionResult: ExecutionSearchResult | null = null;
          let taxCertificates: CachedTaxCertificates | null = null;
          let vatDealerStatus: VATDealerStatus | null = null;  // NEW: VAT registration
          let osekMorshehData: OsekMorsheh | null = null;  // NEW: Individual business (עוסק מורשה)
          
          // CRITICAL: Classify HP number first
          const classification = classifyByHPNumber(parseInt(hpNumber));
          console.log(`[UnifiedData] HP ${hpNumber} classified as: ${classification.database}`);
          
          if (options.includeAllSources) {
            console.log(`[UnifiedData] Fetching all free government sources...`);
            
            // Fetch osek_morsheh FIRST for non-company HPs
            if (classification.database === 'osek_morsheh') {
              osekMorshehData = await getOsekMorsheh(parseInt(hpNumber)).catch(err => {
                console.warn(`[OsekMorsheh] Error:`, err.message);
                return null;
              });
            }
            
            [mugbalimResult, taxStatus, courtCases, executionResult, taxCertificates, vatDealerStatus] = await Promise.all([
              checkMugbalimStatus(hpNumber).catch(err => {
                console.warn(`[Mugbalim] Error:`, err.message);
                return null;
              }),
              checkTaxStatus(hpNumber).catch(err => {
                console.warn(`[TaxAuthority] Error:`, err.message);
                return null;
              }),
              searchLegalCases(cachedCompany.nameHebrew, hpNumber).catch(err => {
                console.warn(`[Courts] Error:`, err.message);
                return null;
              }),
              searchExecutionProceedings(hpNumber, cachedCompany.nameHebrew).catch(err => {
                console.warn(`[Execution] Error:`, err.message);
                return null;
              }),
              getTaxCertificatesWithCache(hpNumber, { forceRefresh: options.forceRefresh }).catch(err => {
                console.warn(`[TaxCertificates] Error:`, err.message);
                return null;
              }),
              getVATDealerStatus(hpNumber, { forceRefresh: options.forceRefresh }).catch(err => {
                console.warn(`[VATDealer] Error:`, err.message);
                return null;
              }),
            ]);
          }
          
          const result = mapPostgreSQLToUnified(
            cachedCompany, 
            legalCases, 
            executionProcs,
            mugbalimResult,
            taxStatus,
            courtCases,
            executionResult,
            taxCertificates,
            vatDealerStatus,  // NEW: Pass VAT dealer status
            osekMorshehData   // NEW: Pass individual business data
          );
          
          await logScrapingOperation({
            source: 'postgresql',
            operation: 'search_company',
            hpNumber,
            status: 'success',
            responseTimeMs: Date.now() - startTime,
          });
          
          return result;
        } else {
          console.log(`[UnifiedData] Data outdated (>7 days) - Will scrape`);
        }
      }
    }
    
    // Step 2: Try real-time scraping (NOT IMPLEMENTED YET)
    // TODO: Implement ICA scraper
    // const scrapedData = await scrapeICACompany(hpNumber);
    // if (scrapedData) { ... }
    
    // Step 3: Fallback to mock data
    console.log(`[UnifiedData] Using MOCK data for HP ${hpNumber}`);
    
    // CRITICAL FIX: Pass original business name to preserve user input
    const mockData = getMockBusinessData(hpNumber, options.businessName);
    
    if (!mockData) {
      return null;
    }
    
    await logScrapingOperation({
      source: 'mock_data',
      operation: 'search_company',
      hpNumber,
      status: 'success',
      responseTimeMs: Date.now() - startTime,
    });
    
    return mapCheckIDToUnified(mockData);
    
  } catch (error) {
    console.error(`[UnifiedData] Error fetching business data:`, error);
    
    await logScrapingOperation({
      source: 'unified',
      operation: 'search_company',
      hpNumber,
      status: 'failure',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs: Date.now() - startTime,
    });
    
    return null;
  }
}

/**
 * Search companies by name (PostgreSQL first, then fallback)
 */
export async function searchCompaniesByName(
  name: string,
  limit: number = 10
): Promise<Array<{ hpNumber: string; nameHebrew: string; companyType: string }>> {
  
  try {
    // Check PostgreSQL health first
    const dbHealthy = await checkDatabaseHealth();
    
    if (!dbHealthy) {
      console.warn('[UnifiedData] PostgreSQL unavailable - skipping search');
      return [];
    }
    
    // Use existing PostgreSQL function
    const { searchCompaniesByName: pgSearch } = await import('./db/postgres');
    const results = await pgSearch(name, limit);
    
    return results.map(company => ({
      hpNumber: company.hpNumber,
      nameHebrew: company.nameHebrew,
      companyType: company.companyType,
    }));
    
  } catch (error) {
    console.error('[UnifiedData] Error searching companies:', error);
    return [];
  }
}

/**
 * Count withholding tax categories without approval
 * @internal
 */
function countWithholdingTaxIssues(certificates: CachedTaxCertificates): number {
  let count = 0;
  const categories = certificates.withholdingTaxCategories;
  
  if (categories.services === 'אין אישור') count++;
  if (categories.construction === 'אין אישור') count++;
  if (categories.securityCleaning === 'אין אישור') count++;
  if (categories.production === 'אין אישור') count++;
  if (categories.consulting === 'אין אישור') count++;
  if (categories.planningAdvertising === 'אין אישור') count++;
  if (categories.itServices === 'אין אישור') count++;
  if (categories.insurancePension === 'אין אישור') count++;
  
  return count;
}

/**
 * Map PostgreSQL data to unified format
 */
function mapPostgreSQLToUnified(
  company: CompanyProfile,
  legalCases: LegalCase[],
  executionProceedings: ExecutionProceeding[],
  mugbalimResult?: MugbalimCheckResult | null,
  taxStatus?: TaxStatus | null,
  courtCases?: CourtSearchResult | null,
  executionResult?: ExecutionSearchResult | null,
  taxCertificates?: CachedTaxCertificates | null,
  vatDealer?: VATDealerStatus | null,  // NEW: VAT dealer status (companies)
  osekMorsheh?: OsekMorsheh | null    // NEW: Individual business (עוסק מורשה)
): UnifiedBusinessData {
  
  const activeCases = legalCases.filter(c => c.caseStatus === 'פעיל').length;
  const totalDebt = executionProceedings.reduce((sum, proc) => sum + (proc.debtAmount || 0), 0);
  
  // Combine court cases from both sources
  const combinedCourtCases = courtCases?.totalCases || legalCases.length;
  const combinedActiveCase = courtCases?.activeCases || activeCases;
  
  // Combine execution data from both sources
  const combinedDebt = executionResult?.totalDebt || totalDebt;
  const combinedExecutionProcs = executionResult?.totalProceedings || executionProceedings.length;
  
  // Check for bankruptcy in court cases
  const hasBankruptcy = courtCases?.bankruptcyCases && courtCases.bankruptcyCases > 0;
  
  // NEW: Calculate bookkeeping risk if no direct data available
  let bookkeepingRiskAssessment: RiskAssessment | undefined;
  
  if (!taxCertificates || taxCertificates.bookkeepingApproval.status === 'לא ידוע') {
    // Collect risk factors
    const riskFactors: RiskFactors = {
      violations: company.violations as any,
      violationsCode: company.violationsCode || undefined,
      companyStatus: company.status as any,
      activeLegalCases: combinedActiveCase,
      totalLegalCases: combinedCourtCases,
      activeExecutionProceedings: combinedExecutionProcs,
      totalDebt: combinedDebt,
      hasRestrictedBankAccount: mugbalimResult?.isRestricted || false,
    };
    
    // Add withholding tax issues if available
    if (taxCertificates) {
      riskFactors.hasWithholdingTaxIssues = countWithholdingTaxIssues(taxCertificates);
    }
    
    // Calculate risk assessment
    bookkeepingRiskAssessment = calculateBookkeepingRisk(riskFactors);
  }
  
  return {
    hpNumber: company.hpNumber,
    nameHebrew: company.nameHebrew,
    nameEnglish: company.nameEnglish,
    companyType: company.companyType,
    status: company.status,
    registrationDate: company.registrationDate,
    
    address: {
      street: company.addressStreet,
      city: company.addressCity,
      zipcode: company.addressZipcode,
    },
    
    phone: company.phone,
    website: company.website,
    email: company.email,
    
    owners: (company.owners || []).map(owner => ({
      name: owner.name,
      role: owner.role,
      sharePercentage: owner.sharePercentage,
    })),
    
    legalIssues: {
      activeCases: combinedActiveCase,
      totalCases: combinedCourtCases,
      executionProceedings: combinedExecutionProcs,
      totalDebt: combinedDebt,
      recentCases: legalCases.slice(0, 5).map(c => ({
        caseNumber: c.caseNumber,
        caseType: c.caseType,
        status: c.caseStatus,
        filingDate: c.filingDate,
      })),
    },
    
    // NEW: Tax status from Tax Authority (osekMorsheh > vatDealer > taxStatus)
    // Priority: Individual business database (osek_morsheh) has highest priority
    taxStatus: osekMorsheh ? {
      isMaamRegistered: osekMorsheh.is_vat_registered,  // עוסק מורשה
      isMaamExempt: !osekMorsheh.is_vat_registered,     // עוסק פטור
      maamNumber: osekMorsheh.vat_number,
      hasNikuiBamakor: false,  // TODO: Add to osek_morsheh schema
      lastVerified: osekMorsheh.last_verified_at.toISOString(),
    } : (vatDealer ? {
      isMaamRegistered: vatDealer.isVATRegistered,  // עוסק מורשה
      isMaamExempt: !vatDealer.isVATRegistered,     // עוסק פטור
      maamNumber: vatDealer.vatNumber,
      hasNikuiBamakor: vatDealer.hasNikuiBamakor,
      lastVerified: vatDealer.lastUpdated,
    } : (taxStatus ? {
      isMaamRegistered: taxStatus.isMaamRegistered,
      isMaamExempt: taxStatus.isMaamExempt,
      maamNumber: taxStatus.maamNumber,
      hasNikuiBamakor: taxStatus.hasNikuiBamakor,
      lastVerified: taxStatus.lastVerified,
    } : undefined)),
    
    // NEW: Banking status from Bank of Israel
    bankingStatus: mugbalimResult ? {
      hasRestrictedAccount: mugbalimResult.isRestricted,
      restrictionDate: mugbalimResult.records[0]?.restrictionDate,
      restrictionDetails: mugbalimResult.records.map(r => 
        `${r.bank || 'Unknown Bank'} - ${r.restrictionDate}`
      ),
    } : undefined,
    
    // NEW: Tax Certificates (ניהול ספרים + ניכוי מס)
    taxCertificates: taxCertificates ? {
      bookkeepingApproval: {
        hasApproval: taxCertificates.bookkeepingApproval.hasApproval,
        expirationDate: taxCertificates.bookkeepingApproval.expirationDate,
        status: taxCertificates.bookkeepingApproval.status,
      },
      withholdingTax: {
        services: taxCertificates.withholdingTaxCategories.services,
        construction: taxCertificates.withholdingTaxCategories.construction,
        securityCleaning: taxCertificates.withholdingTaxCategories.securityCleaning,
        production: taxCertificates.withholdingTaxCategories.production,
        consulting: taxCertificates.withholdingTaxCategories.consulting,
        planningAdvertising: taxCertificates.withholdingTaxCategories.planningAdvertising,
        itServices: taxCertificates.withholdingTaxCategories.itServices,
        insurancePension: taxCertificates.withholdingTaxCategories.insurancePension,
      },
      _meta: {
        lastUpdated: taxCertificates._cache.lastUpdated,
        cacheAgeDays: taxCertificates._cache.cacheAgeDays,
        source: 'taxinfo.taxes.gov.il',
      },
    } : undefined,
    
    industry: undefined, // TODO: Add industry classification
    businessPurpose: company.businessPurpose,
    
    // CRITICAL FIX: Check violations field (not status field)
    violations: company.violations,
    violationsCode: company.violationsCode,
    limitations: company.limitations,
    governmentCompany: company.governmentCompany,
    lastAnnualReport: company.lastAnnualReport,
    businessDescription: company.description,
    
    riskIndicators: {
      hasActiveLegalCases: combinedActiveCase > 0,
      hasExecutionProceedings: combinedExecutionProcs > 0,
      isCompanyViolating: company.violations === 'מפרה' || company.violationsCode === '18',  // FIX: Check violations field!
      hasHighDebt: combinedDebt > 100000, // ₪100K threshold
      hasRestrictedBankAccount: mugbalimResult?.isRestricted || false,
      hasBankruptcyProceedings: hasBankruptcy || false,
      hasNoBookkeepingApproval: taxCertificates ? !taxCertificates.bookkeepingApproval.hasApproval : false,
      hasLimitedWithholdingTaxApprovals: taxCertificates ? countWithholdingTaxIssues(taxCertificates) >= 4 : false,
    },
    
    // NEW: Add risk assessment if calculated
    bookkeepingRisk: bookkeepingRiskAssessment ? {
      score: bookkeepingRiskAssessment.score,
      level: bookkeepingRiskAssessment.level,
      confidence: bookkeepingRiskAssessment.confidence,
      factors: bookkeepingRiskAssessment.factors,
      recommendation: bookkeepingRiskAssessment.recommendation,
      calculatedAt: new Date().toISOString(),
    } : undefined,
    
    dataSource: 'postgresql',
    dataQuality: company.dataQualityScore > 70 ? 'high' : company.dataQualityScore > 40 ? 'medium' : 'low',
    lastUpdated: company.lastUpdated,
    cacheHit: true,
  };
}

/**
 * Map CheckID mock data to unified format
 */
function mapCheckIDToUnified(mockData: CheckIDBusinessData): UnifiedBusinessData {
  return {
    hpNumber: mockData.registrationNumber,
    nameHebrew: mockData.name,
    nameEnglish: undefined,
    companyType: mockData.type,
    status: mockData.status,
    registrationDate: mockData.foundedDate,
    
    violations: mockData.status === 'violating' ? 'מפרה' : undefined,
    violationsCode: mockData.status === 'violating' ? '18' : undefined,
    
    address: {
      street: mockData.address?.street,
      city: mockData.address?.city,
      zipcode: mockData.address?.zipCode,
    },
    
    phone: undefined,
    website: undefined,
    email: undefined,
    
    owners: mockData.owners?.map(owner => ({
      name: owner.name,
      role: owner.role || 'Unknown',
      sharePercentage: undefined,
    })) || [],
    
    legalIssues: {
      activeCases: 0,
      totalCases: 0,
      executionProceedings: 0,
      totalDebt: 0,
      recentCases: [],
    },
    
    industry: mockData.industry,
    businessPurpose: undefined,
    
    riskIndicators: {
      hasActiveLegalCases: false,
      hasExecutionProceedings: false,
      isCompanyViolating: mockData.status === 'violating',
      hasHighDebt: false,
      hasRestrictedBankAccount: false,
      hasBankruptcyProceedings: false,
      hasNoBookkeepingApproval: false,
      hasLimitedWithholdingTaxApprovals: false,
    },
    
    dataSource: 'mock_data',
    dataQuality: 'medium',
    lastUpdated: new Date().toISOString(),
    cacheHit: false,
  };
}

/**
 * Health check for all data sources
 */
export async function checkDataSourcesHealth() {
  const postgresql = await checkDatabaseHealth();
  
  // NEW: Check all CheckID-equivalent sources
  const [boiHealth, taxHealth, courtsHealth, executionHealth] = await Promise.allSettled([
    checkMugbalimStatus('000000000').then(() => true).catch(() => false),
    checkTaxStatus('000000000').then(() => true).catch(() => false),
    searchLegalCases('Test Company').then(() => true).catch(() => false),
    searchExecutionProceedings('000000000').then(() => true).catch(() => false),
  ]);
  
  return {
    postgresql,
    boi_mugbalim: boiHealth.status === 'fulfilled' ? boiHealth.value : false,
    tax_authority: taxHealth.status === 'fulfilled' ? taxHealth.value : false,
    courts: courtsHealth.status === 'fulfilled' ? courtsHealth.value : false,
    execution_office: executionHealth.status === 'fulfilled' ? executionHealth.value : false,
    ica_scraping: false,  // TODO: Implement scraper health check
    court_scraping: false, // TODO: Implement scraper health check
    mock_data: true,
  };
}

export default {
  getBusinessData,
  searchCompaniesByName,
  checkDataSourcesHealth,
};
