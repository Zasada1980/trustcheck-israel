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
          
          if (options.includeAllSources) {
            console.log(`[UnifiedData] Fetching all free government sources...`);
            
            [mugbalimResult, taxStatus, courtCases, executionResult] = await Promise.all([
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
            ]);
          }
          
          const result = mapPostgreSQLToUnified(
            cachedCompany, 
            legalCases, 
            executionProcs,
            mugbalimResult,
            taxStatus,
            courtCases,
            executionResult
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
    
    const mockData = getMockBusinessData(hpNumber);
    
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
 * Map PostgreSQL data to unified format
 */
function mapPostgreSQLToUnified(
  company: CompanyProfile,
  legalCases: LegalCase[],
  executionProceedings: ExecutionProceeding[],
  mugbalimResult?: MugbalimCheckResult | null,
  taxStatus?: TaxStatus | null,
  courtCases?: CourtSearchResult | null,
  executionResult?: ExecutionSearchResult | null
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
    
    // NEW: Tax status from Tax Authority
    taxStatus: taxStatus ? {
      isMaamRegistered: taxStatus.isMaamRegistered,
      isMaamExempt: taxStatus.isMaamExempt,
      maamNumber: taxStatus.maamNumber,
      hasNikuiBamakor: taxStatus.hasNikuiBamakor,
      lastVerified: taxStatus.lastVerified,
    } : undefined,
    
    // NEW: Banking status from Bank of Israel
    bankingStatus: mugbalimResult ? {
      hasRestrictedAccount: mugbalimResult.isRestricted,
      restrictionDate: mugbalimResult.records[0]?.restrictionDate,
      restrictionDetails: mugbalimResult.records.map(r => 
        `${r.bank || 'Unknown Bank'} - ${r.restrictionDate}`
      ),
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
    },
    
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
